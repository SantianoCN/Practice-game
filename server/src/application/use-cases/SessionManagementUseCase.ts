import { IGameRepository } from '../interfaces/IGameRepository';
import { IIdGenerator } from '../interfaces/IIdGenerator';
import { GameSession } from '../../domain/entities/GameSession';
import { EntityFactory } from '../../domain/factories/EntityFactory';
import { MapGenerator } from '../../domain/world/FloorGenerator';
import { Room } from '../../domain/entities/Room';
import { Chest } from '../../domain/entities/Chest';
import { GAME_CONFIG } from '@game/shared';
import { IPresetProvider } from '../interfaces/IPresetProvider'; 

export class SessionManagementUseCase {
    private deleteTimers = new Map<string, ReturnType<typeof setTimeout>>();

    constructor(
        private repo: IGameRepository,
        private idGen: IIdGenerator,
        private presetProvider: IPresetProvider,
        private roomWidth: number,
        private roomHeight: number
    ) {}

    /**
     * ШАГ 6: Получить сессию по ID (используется контроллером для проверки хоста)
     */
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
        const session = new GameSession(sessionId, this.roomWidth, this.roomHeight);
        
        session.isLobby = false;
        session.hostId = userId; // <-- ШАГ 6+: Объявляем создателя одиночного похода его хостом!

        const mapGenerator = new MapGenerator(
            GAME_CONFIG.MAP_SIZE,
            15,
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
        const session = new GameSession(sessionId, this.roomWidth, this.roomHeight);
        
        session.isLobby = true;
        session.hostId = userId;

        session.floorMap = Array(GAME_CONFIG.MAP_SIZE).fill(null).map(() => Array(GAME_CONFIG.MAP_SIZE).fill(null));

        const startX = Math.floor(GAME_CONFIG.MAP_SIZE / 2);
        const startY = Math.floor(GAME_CONFIG.MAP_SIZE / 2);

        const lobbyRoom = new Room(startX, startY, 'Start', 0);
        lobbyRoom.isClear = true;
        lobbyRoom.hasDoors = { Top: false, Bottom: false, Left: false, Right: false };
        
        this.spawnTestChests(lobbyRoom);

        session.floorMap[startY][startX] = lobbyRoom;
        
        this.repo.save(session);
        this.addPlayerToSession(session, userId, login, archetype, weaponId);

        return sessionId;
    }

    /**
     * Вспомогательный метод для спавна тестовых сундуков по бокам от игрока
     */
    private spawnTestChests(room: Room): void {
        const cellSize = GAME_CONFIG.CELL_SIZE;

        const woodenPreset = this.presetProvider.getChestPreset('chest_wooden');
        const goldPreset = this.presetProvider.getChestPreset('chest_gold_boss');

        const woodenW = woodenPreset ? woodenPreset.width : 28;
        const woodenH = woodenPreset ? woodenPreset.height : 28;

        const goldW = goldPreset ? goldPreset.width : 36;
        const goldH = goldPreset ? goldPreset.height : 36;

        // 1. Спавним 10 деревянных сундуков слева (сетка 2 колонки x 5 рядов)
        for (let i = 0; i < 10; i++) {
            const col = i % 2;             
            const row = Math.floor(i / 2); 
            
            const x = 100 + col * 60;      
            const y = 140 + row * 70;      

            const woodenChest = new Chest(
                this.idGen.generateId('chest'),
                x,
                y,
                woodenW,
                woodenH,
                Math.floor(x / cellSize),
                Math.floor(y / cellSize),
                'chest_wooden'
            );
            room.chests.push(woodenChest);
        }

        // 2. Спавним 10 золотых сундуков справа (сетка 2 колонки x 5 рядов)
        for (let i = 0; i < 10; i++) {
            const col = i % 2;             
            const row = Math.floor(i / 2); 
            
            const x = 640 + col * 60;      
            const y = 140 + row * 70;      

            const goldChest = new Chest(
                this.idGen.generateId('chest'),
                x,
                y,
                goldW,
                goldH,
                Math.floor(x / cellSize),
                Math.floor(y / cellSize),
                'chest_gold_boss'
            );
            room.chests.push(goldChest);
        }
    }

    public joinLobby(sessionId: string, userId: string, login: string, archetype: string, weaponId: string): boolean {
        const session = this.repo.get(sessionId);
        
        if (!session) return false;
        
        if (!session.isLobby) {
            console.log(`[Security Action] Попытка несанкционированного входа в уже активный бой: ${sessionId}`);
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
            15, 
            session.roomWidth,
            session.roomHeight,
            (prefix) => this.idGen.generateId(prefix),
            (id) => this.presetProvider.getChestPreset(id)
        );

        session.floorMap = mapGenerator.generate();
        session.isLobby = false;

        const startX = Math.floor(GAME_CONFIG.MAP_SIZE / 2);
        const startY = Math.floor(GAME_CONFIG.MAP_SIZE / 2);

        const startRoom = session.getRoom(startX, startY);
        if (startRoom) {
            this.spawnTestChests(startRoom);
        }

        for (const player of session.players.values()) {
            player.roomX = startX;
            player.roomY = startY;
            player.x = session.roomWidth / 2;
            player.y = session.roomHeight / 2;
            player.vx = 0;
            player.vy = 0;
        }

        return true;
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