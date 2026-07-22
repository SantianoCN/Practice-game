import { IGameRepository } from '../interfaces/IGameRepository';
import { IIdGenerator } from '../interfaces/IIdGenerator';
import { GameSession } from '../../domain/entities/GameSession';
import { EntityFactory } from '../../domain/factories/EntityFactory';
import { MapGenerator } from '../../domain/world/FloorGenerator';
import { Room } from '../../domain/entities/Room';
import { GAME_CONFIG } from '@game/shared';
import { IPresetProvider } from '../interfaces/IPresetProvider'; 
import { GAME_DIFFICULTY } from '@game/shared/';
import { ISaveRepository } from '../interfaces/ISaveRepository';

export class SessionManagementUseCase {
    private deleteTimers = new Map<string, ReturnType<typeof setTimeout>>();
    private reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

    constructor(
        private repo: IGameRepository,
        private idGen: IIdGenerator,
        private presetProvider: IPresetProvider,
        private roomWidth: number,
        private roomHeight: number,        private saveRepo: ISaveRepository
    ) {}

    public getSession(sessionId: string): GameSession | undefined {
        return this.repo.get(sessionId);
    }

    public terminateSession(sessionId: string): void {
        const pendingTimer = this.deleteTimers.get(sessionId);
        if (pendingTimer) {
            clearTimeout(pendingTimer);
            this.deleteTimers.delete(sessionId);
        }
        this.repo.delete(sessionId);
    }

    public terminateSessionWithNotification(sessionId: string, message: string, io: any): void {
        const session = this.repo.get(sessionId);
        if (!session) return;

        for (const player of session.players.values()) {
            if (player.isOnline) {
                io.to(player.id).emit('server:session-terminated', { message });
            }
        }
        this.terminateSession(sessionId);
    }

    private addPlayerToSession(session: GameSession, userId: string, login: string, archetype: string, weaponId: string): void {
        const pendingTimer = this.deleteTimers.get(session.sessionId);
        if (pendingTimer) {
            clearTimeout(pendingTimer);
            this.deleteTimers.delete(session.sessionId);
        }

        const player = EntityFactory.createPlayer(
            userId, login, archetype, weaponId, 
            session.roomWidth / 2, session.roomHeight / 2, 
            (prefix) => this.idGen.generateId(prefix)
        );
        
        player.roomX = Math.floor(GAME_CONFIG.MAP_SIZE / 2);
        player.roomY = Math.floor(GAME_CONFIG.MAP_SIZE / 2);

        session.addPlayer(player);
    }

    public createSession(userId: string, login: string, archetype: string, weaponId: string): string {
        const sessionId = this.idGen.generateUUID('session');
        const difficulty = GAME_DIFFICULTY.LVL1;
        const session = new GameSession(sessionId, this.roomWidth, this.roomHeight, difficulty);
        
        session.isLobby = false;
        session.hostId = userId;
        session.hostLogin = login;

        const mapGenerator = new MapGenerator(
            GAME_CONFIG.MAP_SIZE,
            difficulty,
            this.roomWidth,
            this.roomHeight,
            (prefix) => this.idGen.generateId(prefix),
            (id) => this.presetProvider.getChestPreset(id)
        );

        session.floorMap = mapGenerator.generate();
        this.repo.save(session);
        this.addPlayerToSession(session, userId, login, archetype, weaponId);

        return sessionId;
    }

    public createLobby(userId: string, login: string, archetype: string, weaponId: string): string {
        const sessionId = this.idGen.generateUUID('session');
        const difficulty = GAME_DIFFICULTY.LVL1;
        const session = new GameSession(sessionId, this.roomWidth, this.roomHeight, difficulty);
        
        session.isLobby = true;
        session.hostId = userId;
        session.hostLogin = login;

        session.floorMap = Array(GAME_CONFIG.MAP_SIZE).fill(null).map(() => Array(GAME_CONFIG.MAP_SIZE).fill(null));

        const startX = Math.floor(GAME_CONFIG.MAP_SIZE / 2);
        const startY = Math.floor(GAME_CONFIG.MAP_SIZE / 2);

        const lobbyRoom = new Room(startX, startY, 'Start', 0);
        lobbyRoom.isClear = true;
        lobbyRoom.hasDoors = { Top: false, Bottom: false, Left: false, Right: false };

        session.floorMap[startY][startX] = lobbyRoom;
        
        this.repo.save(session);
        this.addPlayerToSession(session, userId, login, archetype, weaponId);

        return sessionId;
    }

    public async loadRestoredLobby(sessionId: string): Promise<string | null> {
        const session = await this.saveRepo.loadRun(sessionId);
        if (!session) return null;

        session.isLobby = true; // Загруженный сейв принудительно разворачиваем как лобби

        // Генерируем временную пустую сетку комнат для лобби ожидания в ОЗУ
        session.floorMap = Array(GAME_CONFIG.MAP_SIZE).fill(null).map(() => Array(GAME_CONFIG.MAP_SIZE).fill(null));

        const startX = Math.floor(GAME_CONFIG.MAP_SIZE / 2);
        const startY = Math.floor(GAME_CONFIG.MAP_SIZE / 2);

        // Создаем временную безопасную комнату лобби, чтобы игроки могли ходить и видеть друг друга до старта
        const lobbyRoom = new Room(startX, startY, 'Start', 0);
        lobbyRoom.isClear = true;
        lobbyRoom.hasDoors = { Top: false, Bottom: false, Left: false, Right: false };

        session.floorMap[startY][startX] = lobbyRoom;

        this.repo.save(session);
        return session.sessionId;
    }

    public joinLobby(sessionId: string, userId: string, login: string, archetype: string, weaponId: string): boolean {
        const session = this.repo.get(sessionId);
        if (!session) return false;
        
        if (!session.isLobby) {
            console.log(`[Security Action] Попытка несанкционированного входа в уже активный бой: ${sessionId}`);
            return false;
        }

        // Если это восстановленная сессия по белому списку
        if (session.allowedLogins.size > 0) {
            if (!session.allowedLogins.has(login)) {
                console.log(`[Security Action] Игрок ${login} не имеет прав доступа к сессии ${sessionId}`);
                return false;
            }

            // Находим уже воссозданный оффлайн-персонаж в сессии
            const existingPlayer = Array.from(session.players.values()).find(p => p.name === login);
            if (existingPlayer) {
                // Перенаправляем оффлайн-id на активный сокет зашедшего друга
                session.removePlayer(existingPlayer.id);
                existingPlayer.id = userId;
                existingPlayer.isOnline = true;

                // Сбрасываем его координаты строго на центр лобби ожидания
                existingPlayer.roomX = Math.floor(GAME_CONFIG.MAP_SIZE / 2);
                existingPlayer.roomY = Math.floor(GAME_CONFIG.MAP_SIZE / 2);
                existingPlayer.x = this.roomWidth / 2;
                existingPlayer.y = this.roomHeight / 2;
                existingPlayer.vx = 0;
                existingPlayer.vy = 0;
                existingPlayer.lastBroadcastedRoomX = null;
                existingPlayer.lastBroadcastedRoomY = null;

                session.addPlayer(existingPlayer);
                console.log(`[Restore Join] Игрок ${login} вернулся на свое сохраненное место в лобби.`);
                return true;
            }
            return false;
        }

        // Обычное новое подключение
        this.addPlayerToSession(session, userId, login, archetype, weaponId);
        return true;
    }
    
    public startMatch(sessionId: string, userId: string): boolean {
        const session = this.repo.get(sessionId);
        if (!session || !session.isLobby) return false;
        if (session.hostId !== userId) return false; 

        const mapGenerator = new MapGenerator(
            GAME_CONFIG.MAP_SIZE,
            session.difficulty, 
            session.roomWidth,
            session.roomHeight,
            (prefix) => this.idGen.generateId(prefix),
            (id) => this.presetProvider.getChestPreset(id)
        );

        session.floorMap = mapGenerator.generate();
        session.isLobby = false;

        const startX = Math.floor(GAME_CONFIG.MAP_SIZE / 2);
        const startY = Math.floor(GAME_CONFIG.MAP_SIZE / 2);

        // Инициализируем только тех, кто реально пришел в лобби
        for (const player of session.players.values()) {
            if (!player.isOnline) {
                // Если кто-то из слотов сейва не пришел, убираем их ХП-модель из текущего уровня ОЗУ
                continue;
            }
            player.roomX = startX;
            player.roomY = startY;
            player.x = session.roomWidth / 2;
            player.y = session.roomHeight / 2;
            player.vx = 0;
            player.vy = 0;
        }

        return true;
    }

    public handlePlayerDisconnect(sessionId: string, userId: string, login: string): void {
        const session = this.repo.get(sessionId);
        if (!session) return;

        const player = session.getPlayer(userId);
        if (!player) return;

        player.isOnline = false;
        console.log(`[Disconnect Tracking] Игрок ${login} потерял связь. Запуск таймера...`);

        // Производим мягкую миграцию лидера, если отключился текущий Хост
        if (session.hostId === userId) {
            const activeOnlinePlayers = Array.from(session.players.values())
                .filter(p => p.id !== userId && p.isOnline);

            if (activeOnlinePlayers.length > 0) {
                session.hostId = activeOnlinePlayers[0].id;
                session.hostLogin = activeOnlinePlayers[0].name;
                console.log(`[Host Migration] Новым воеводой назначен: ${activeOnlinePlayers[0].name}`);
            }
        }

        const reconnectKey = `${sessionId}:${login}`;
        const timer = setTimeout(() => {
            console.log(`[Timeout Expired] Время возвращения ${login} истекло.`);
            this.reconnectTimers.delete(reconnectKey);
            // Персонаж остается в ОЗУ в офлайн режиме (isOnline = false),
            // чтобы завтра записаться в сейв на портале, но сегодня играть он уже не сможет.
        }, 120000); // 120 секунд

        this.reconnectTimers.set(reconnectKey, timer);
    }

    public tryReconnectPlayer(sessionId: string, newUserId: string, login: string): boolean {
        const session = this.repo.get(sessionId);
        if (!session) return false;

        const reconnectKey = `${sessionId}:${login}`;
        const timer = this.reconnectTimers.get(reconnectKey);

        if (timer) {
            clearTimeout(timer);
            this.reconnectTimers.delete(reconnectKey);

            const player = Array.from(session.players.values()).find(p => p.name === login);
            if (player) {
                session.removePlayer(player.id);
                player.id = newUserId;
                player.isOnline = true;
                session.addPlayer(player);

                player.lastBroadcastedRoomX = null;
                player.lastBroadcastedRoomY = null;
                
                console.log(`[Reconnect Success] Игрок ${login} успешно вернулся в строй!`);
                return true;
            }
        }
        return false;
    }

    public leaveSession(sessionId: string, userId: string): void {
        const session = this.repo.get(sessionId);
        if (!session) return;

        session.removePlayer(userId);
        if (session.isEmpty()) {
            if (!this.deleteTimers.has(sessionId)) {
                const GRACE_PERIOD_MS = 15000;

                const timer = setTimeout(() => {
                    this.repo.delete(sessionId);
                    this.deleteTimers.delete(sessionId);
                }, GRACE_PERIOD_MS);

                this.deleteTimers.set(sessionId, timer);
            }
        }
    }
}