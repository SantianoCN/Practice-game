import Player from '../entities/Player';
import Enemy from '../entities/Enemy';
import Bullet from '../entities/Bullet';
import { generateMap, ServerRoomState } from '../utils/mapGenerator';
import { PlayerAction, RoomState as SharedRoomState } from '../../../../shared/gameTypes';
import { GAME_CONFIG } from '../../config/gameConfig';
import { checkAndApplyRoomTransition } from '../services/movementService';
import { gameEventBus, GAME_EVENTS } from '../events/gameEventBus';
import { buildPlayerSnapshot } from '../services/snapshotService';
import { updateActiveRooms } from '../services/roomService';
import { createPlayerEntity } from '../factories/playerFactory'
import { processAllPlayersInputs } from '../services/inputService'
import { Chest } from '../entities/Chest';
import { RoomGridGenerator } from '../utils/RoomGridGenerator';
import GridMapper from '../utils/GridMapper';

export class GameEngine {
    public sessionId: string;

    private players: Map<string, Player>;
    private bullets: Bullet[];
    private lastFrameTime: number = performance.now();
    private roomWidth: number;
    private roomHeight: number;

    private playerInputs: Map<string, PlayerAction>;

    private gameLoopTimer: ReturnType<typeof setTimeout> | null = null;
    private isRunning: boolean = false; 
    private readonly TICK_TIME = 1000 / GAME_CONFIG.TICK_RATE;
    private floorMap: (ServerRoomState | null)[][];

    constructor(sessionId: string) {
        this.sessionId = sessionId;
        this.players = new Map();
        this.bullets = [];
        this.playerInputs = new Map();

        this.roomHeight = GAME_CONFIG.ROOM_HEIGHT;
        this.roomWidth = GAME_CONFIG.ROOM_WIDTH;
        this.floorMap = generateMap(GAME_CONFIG.MIN_ROOMS, GAME_CONFIG.MAX_ROOMS);

        this.populateAllRoomsWithGrid();

        this.startGameLoop();
    }

    public addPlayer(
        userId: string,
        name: string,
        weaponId: string, 
        archetype: string
    ) {
        const newPlayer = createPlayerEntity(
            userId, name, archetype, weaponId, this.roomWidth / 2, this.roomHeight / 2
        );

        this.players.set(userId, newPlayer);
        this.playerInputs.set(userId, {
            keys: { up: false, down: false, left: false, right: false, attack: false }
        });
        console.log('[GameEngine] игрок: ', userId, ', добавлен в сессию: ', this.sessionId);
    }

    public removePlayer(userId: string): boolean {
        this.players.delete(userId);
        this.playerInputs.delete(userId); 
        console.log('[GameEngine] игрок: ', userId, ', удалён из сессии: ', this.sessionId);
        return this.players.size === 0;
    }

    public pushInput(userId: string, actionData: PlayerAction) {
        this.playerInputs.set(userId, actionData);
    }

    private startGameLoop() {
        this.isRunning = true;
        this.tick();
        console.log('[GameEngine] сессия:', this.sessionId, " запущена");
    }

    private tick() {
        if (!this.isRunning) return;
        const startTime = performance.now();
        this.update();
        const executionTime = performance.now() - startTime;
        const nextTickDelay = Math.max(0, this.TICK_TIME - executionTime);
        this.gameLoopTimer = setTimeout(() => this.tick(), nextTickDelay);
    }

    private update() {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;

        processAllPlayersInputs(this.players, this.playerInputs, this.bullets, this.floorMap);

        for (const player of this.players.values()) {
            player.updateEntity(deltaTime);
            checkAndApplyRoomTransition(
                player, 
                this.players, 
                this.floorMap, 
                this.roomWidth, 
                this.roomHeight, 
                GAME_CONFIG.TRANSITION_PADDING
            );
        }

        for (const bullet of this.bullets) {
            bullet.updatePosition(deltaTime);
        }

        updateActiveRooms(
            this.players, 
            this.bullets, 
            this.floorMap,
            
            this.roomWidth, 
            this.roomHeight, 
            deltaTime
        );

        // 2. Двигаем игроков
        for (const player of this.players.values()) {
            player.updateEntity(deltaTime);
        }

        // 3. Двигаем пули (снаряды)
        for (const bullet of this.bullets) {
            bullet.updatePosition(deltaTime);
        }

        this.bullets = this.bullets.filter(b => !b.isDestroyed);

        for (const row of this.floorMap) {
            for (const room of row) {
                if (room) {
                    room.enemies = room.enemies.filter(e => e.hp > 0);
                }
            }
        }

        this.broadcastState();
    }

    private broadcastState() {
        if (this.players.size === 0) return;

        for (const userId of this.players.keys()) {
            const snapshot = buildPlayerSnapshot(userId, this.players, this.bullets, this.floorMap);
            
            if (snapshot) {
                gameEventBus.emit(GAME_EVENTS.SNAPSHOT_READY, {
                    sessionId: this.sessionId,
                    userId: userId,
                    snapshot: snapshot
                });
            }
        }
    }


    private populateAllRoomsWithGrid() {
        for (let y = 0; y < this.floorMap.length; y++) {
            for (let x = 0; x < this.floorMap[y].length; x++) {
                const room = this.floorMap[y][x];

                if (room !== null) {
                    // const roomGrid = RoomGridGenerator.populate(
                    //     this.roomWidth,
                    //     this.roomHeight,
                    //     1 // кол-во сундуков?
                    // );
                    const { obstacles, chests } = RoomGridGenerator.generatePersistence(room);
                    room.chests = chests;

                    room.obstacles = obstacles.map(ob =>
                        GridMapper.mapObstacleToBaseNetworkEntity(
                            ob.id,
                            ob.startGridX,
                            ob.startGridY,
                            ob.endGridX,
                            ob.endGridY,
                            RoomGridGenerator.CELL_SIZE,
                            'black'
                        )
                    );

                    room.chests = chests;
                }
            }
        }
    }

    public stop() {
        this.isRunning = false;
        if (this.gameLoopTimer) {
            clearTimeout(this.gameLoopTimer);
            this.gameLoopTimer = null;
            console.log('[GameEngine] сессия:', this.sessionId, " остановлена");
        }
    }
}