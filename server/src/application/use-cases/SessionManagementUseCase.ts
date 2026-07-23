import { IGameRepository } from '../interfaces/IGameRepository';
import { IIdGenerator } from '../interfaces/IIdGenerator';
import { GameSession } from '../../domain/entities/GameSession';
import { EntityFactory } from '../../domain/factories/EntityFactory';
import { MapGenerator } from '../../domain/world/FloorGenerator';
import { GAME_CONFIG, GAME_DIFFICULTY } from '@game/shared';
import { IPresetProvider } from '../interfaces/IPresetProvider';
import { ISaveRepository } from '../interfaces/ISaveRepository';

export interface HostMigrationResult {
    migrated: boolean;
    newHostId?: string;
    newHostLogin?: string;
    remainingOnlineIds: string[];
}

export class SessionManagementUseCase {
    private deleteTimers = new Map<string, ReturnType<typeof setTimeout>>();
    private reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
    private loginSessionMap = new Map<string, string>();

    constructor(
        private repo: IGameRepository,
        private idGen: IIdGenerator,
        private presetProvider: IPresetProvider,
        private roomWidth: number,
        private roomHeight: number,
        private saveRepo: ISaveRepository
    ) {}

    public getSession(sessionId: string): GameSession | undefined {
        return this.repo.get(sessionId);
    }

    public findActiveSessionByLogin(login: string): string | undefined {
        const sessionId = this.loginSessionMap.get(login);
        if (!sessionId) return undefined;
        if (!this.repo.get(sessionId)) {
            this.loginSessionMap.delete(login);
            return undefined;
        }
        return sessionId;
    }

    public terminateSession(sessionId: string): void {
        const pendingTimer = this.deleteTimers.get(sessionId);
        if (pendingTimer) {
            clearTimeout(pendingTimer);
            this.deleteTimers.delete(sessionId);
        }

        const session = this.repo.get(sessionId);
        if (session) {
            for (const login of session.allowedLogins) {
                if (this.loginSessionMap.get(login) === sessionId) {
                    this.loginSessionMap.delete(login);
                }
            }
        }

        const reconnectPrefix = `${sessionId}:`;
        for (const key of Array.from(this.reconnectTimers.keys())) {
            if (key.startsWith(reconnectPrefix)) {
                clearTimeout(this.reconnectTimers.get(key)!);
                this.reconnectTimers.delete(key);
            }
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
        session.allowedLogins.add(login);
        this.loginSessionMap.set(login, session.sessionId);
    }

    public createSession(userId: string, login: string, archetype: string, weaponId: string): string {
        const sessionId = this.idGen.generateUUID('session');
        const session = new GameSession(sessionId, this.roomWidth, this.roomHeight, GAME_DIFFICULTY.LVL1);

        session.isLobby = false;
        session.hostId = userId;
        session.hostLogin = login;

        const mapGenerator = new MapGenerator(
            GAME_CONFIG.MAP_SIZE,
            session.difficulty,
            session.roomWidth,
            session.roomHeight,
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
        const session = new GameSession(sessionId, this.roomWidth, this.roomHeight, GAME_DIFFICULTY.LVL1);

        session.isLobby = true;
        session.hostId = userId;
        session.hostLogin = login;

        const mapGenerator = new MapGenerator(
            GAME_CONFIG.MAP_SIZE,
            session.difficulty,
            session.roomWidth,
            session.roomHeight,
            (prefix) => this.idGen.generateId(prefix),
            (id) => this.presetProvider.getChestPreset(id)
        );

        session.floorMap = mapGenerator.generateLobby();
        this.repo.save(session);
        this.addPlayerToSession(session, userId, login, archetype, weaponId);

        return sessionId;
    }

    public async loadRestoredLobby(sessionId: string, requestingUserId: string, requestingLogin: string): Promise<string | null> {
        const session = await this.saveRepo.loadRun(sessionId);
        if (!session) return null;
        session.isLobby = true;

        const mapGenerator = new MapGenerator(
            GAME_CONFIG.MAP_SIZE,
            GAME_DIFFICULTY.LVL1,
            this.roomWidth,
            this.roomHeight,
            (prefix) => this.idGen.generateId(prefix),
            (id) => this.presetProvider.getChestPreset(id)
        );

        session.floorMap = mapGenerator.generateLobby();

        for (const login of session.allowedLogins) {
            this.loginSessionMap.set(login, session.sessionId);
        }

        const hostPlayer = Array.from(session.players.values()).find(p => p.name === requestingLogin);
        if (hostPlayer) {
            session.removePlayer(hostPlayer.id);

            hostPlayer.id = requestingUserId;
            hostPlayer.isOnline = true;
            hostPlayer.roomX = Math.floor(GAME_CONFIG.MAP_SIZE / 2);
            hostPlayer.roomY = Math.floor(GAME_CONFIG.MAP_SIZE / 2);
            hostPlayer.x = session.roomWidth / 2;
            hostPlayer.y = session.roomHeight / 2;
            hostPlayer.vx = 0;
            hostPlayer.vy = 0;
            hostPlayer.lastBroadcastedRoomX = null;
            hostPlayer.lastBroadcastedRoomY = null;

            session.addPlayer(hostPlayer);

            session.hostId = requestingUserId;
            session.hostLogin = requestingLogin;
        }

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

        if (session.allowedLogins.size > 0) {
            if (!session.allowedLogins.has(login)) {
                console.log(`[Security Action] Игрок ${login} не имеет прав доступа к сессии ${sessionId}`);
                return false;
            }

            const existingPlayer = Array.from(session.players.values()).find(p => p.name === login);
            if (existingPlayer) {
                session.removePlayer(existingPlayer.id);
                existingPlayer.id = userId;
                existingPlayer.isOnline = true;
                existingPlayer.roomX = Math.floor(GAME_CONFIG.MAP_SIZE / 2);
                existingPlayer.roomY = Math.floor(GAME_CONFIG.MAP_SIZE / 2);
                existingPlayer.x = this.roomWidth / 2;
                existingPlayer.y = this.roomHeight / 2;
                existingPlayer.vx = 0;
                existingPlayer.vy = 0;
                existingPlayer.lastBroadcastedRoomX = null;
                existingPlayer.lastBroadcastedRoomY = null;

                session.addPlayer(existingPlayer);
                this.loginSessionMap.set(login, sessionId);
                console.log(`[Restore Join] Игрок ${login} вернулся на свое сохраненное место в лобби.`);
                return true;
            }
            return false;
        }

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

        for (const player of session.players.values()) {
            if (!player.isOnline) {
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

    private migrateHostIfNeeded(session: GameSession, departingUserId: string): HostMigrationResult {
        const remainingOnlineIds = Array.from(session.players.values())
            .filter(p => p.id !== departingUserId && p.isOnline)
            .map(p => p.id);

        if (session.hostId !== departingUserId) {
            return { migrated: false, remainingOnlineIds };
        }

        const candidate = Array.from(session.players.values())
            .find(p => p.id !== departingUserId && p.isOnline);

        if (!candidate) {
            return { migrated: false, remainingOnlineIds };
        }

        session.hostId = candidate.id;
        session.hostLogin = candidate.name;

        return {
            migrated: true,
            newHostId: session.hostId,
            newHostLogin: session.hostLogin,
            remainingOnlineIds
        };
    }

    public handlePlayerDisconnect(sessionId: string, userId: string, login: string): HostMigrationResult | null {
        const session = this.repo.get(sessionId);
        if (!session) return null;

        const player = session.getPlayer(userId);
        if (!player) return null;

        player.isOnline = false;
        console.log(`[Disconnect Tracking] Игрок ${login} потерял связь. Запуск таймера...`);

        const migrationResult = this.migrateHostIfNeeded(session, userId);
        if (migrationResult.migrated) {
            console.log(`[Host Migration] Новым воеводой назначен: ${migrationResult.newHostLogin}`);
        }

        const reconnectKey = `${sessionId}:${login}`;
        const timer = setTimeout(() => {
            console.log(`[Timeout Expired] Время возвращения ${login} истекло.`);
            this.reconnectTimers.delete(reconnectKey);
        }, 120000);

        this.reconnectTimers.set(reconnectKey, timer);

        return migrationResult;
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

    public leaveSession(sessionId: string, userId: string, login: string): HostMigrationResult | null {
        const session = this.repo.get(sessionId);
        if (!session) return null;

        session.removePlayer(userId);
        session.allowedLogins.delete(login);
        this.loginSessionMap.delete(login);

        const migrationResult = this.migrateHostIfNeeded(session, userId);

        if (session.isEmpty()) {
            if (!this.deleteTimers.has(sessionId)) {
                const GRACE_PERIOD_MS = 15000;

                const timer = setTimeout(() => {
                    this.terminateSession(sessionId);
                }, GRACE_PERIOD_MS);

                this.deleteTimers.set(sessionId, timer);
            }
        }

        return migrationResult;
    }
}