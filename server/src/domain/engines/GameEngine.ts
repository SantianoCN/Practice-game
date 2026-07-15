import Player from '../entities/Player';
import Enemy from '../entities/Enemy';
import Bullet from '../entities/Bullet';
import { WARRIOR_PRESET_LIZARD } from '../../config/enemyPresets';
import { STAFF } from '../../config/weaponPresets';
import Weapon from '../items/Weapon';
import { IdGenerator } from '../utils/IDGenerator';
import { MapGenerator } from '../utils/mapGenerator';
import { PlayerAction, GameSnapshot, RoomState as SharedRoomState } from '../../../../shared/gameTypes';
import { CollisionEngine } from './CollisionEngine';
import { PLAYER_CLASSES } from '../../config/playerPresets';
import { Chest } from '../entities/Chest';
import { Obstacle } from '../entities/Obstacle';
import { RoomGridGenerator } from '../utils/RoomGridGenerator';
import GridMapper from '../utils/GridMapper';

export interface ServerRoomState extends Omit<SharedRoomState, 'enemies'> {
    enemies: Enemy[];
}

export class GameEngine {
    public roomId: string;

    private players: Map<string, Player>;
    private bullets: Bullet[];
    private lastFrameTime: number = performance.now();
    private roomWidth: number;
    private roomHeight: number;

    private playerInputs: Map<string, PlayerAction>;
    private networkCallbacks: Map<string, (snapshot: GameSnapshot) => void>;

    private gameLoopInterval: ReturnType<typeof setInterval> | null = null;
    private readonly TICK_RATE = 20;
    private readonly TICK_TIME = 1000 / this.TICK_RATE;
    private static readonly ROOM_WIDTH = 800;
    private static readonly ROOM_HEIGHT = 600;
    private floorGenerator: MapGenerator;
    private floorMap: (ServerRoomState | null)[][];

    constructor(roomId: string) {
        this.roomId = roomId;
        this.players = new Map();
        this.bullets = [];
        this.playerInputs = new Map();
        this.networkCallbacks = new Map();
        this.roomHeight = GameEngine.ROOM_HEIGHT;
        this.roomWidth = GameEngine.ROOM_WIDTH;
        this.floorGenerator = new MapGenerator();
        this.floorMap = this.floorGenerator.generate(5, 10);
        this.populateAllRoomsWithGrid();

        this.logFloorMap();

        this.startGameLoop();
        this.populateDungeonWithEnemies();
    }

    private logFloorMap(): void {
        console.log(`\n[GameRoom] Сгенерирована карта этажа для комнаты: ${this.roomId}`);
        const mapRender = this.floorMap
            .map(row => row.map(cell => (cell !== null ? '██' : '░░')).join(' '))
            .join('\n');
        console.log(mapRender);
        console.log(`=============================================\n`);
    }

    public addPlayer(
        userId: string,
        name: string,
        weaponId: string,
        archetype: string,
        emitCallback: (snapshot: GameSnapshot) => void
    ) {
        let selectedPreset = PLAYER_CLASSES[archetype];

        if (!selectedPreset) {
            console.warn(`[GameEngine] Получен неизвестный класс: "${archetype}" от игрока ${userId}. Сбрасываем на warrior.`);
            selectedPreset = PLAYER_CLASSES.warrior;
        }

        const weaponPreset = selectedPreset.startingWeapons.find(w => w.key === weaponId)
            || selectedPreset.startingWeapons[0];

        const weaponInstanceId = IdGenerator.generateId('weapon');
        const startWeapon = new Weapon(
            weaponInstanceId,
            weaponPreset.name,
            weaponPreset.config
        );

        const newPlayer = new Player(
            userId,
            name,
            400,
            400,
            selectedPreset.stats,
            startWeapon
        );

        this.players.set(userId, newPlayer);
        this.networkCallbacks.set(userId, emitCallback);
        this.playerInputs.set(userId, {
            keys: { up: false, down: false, left: false, right: false, attack: false }
        });
        console.log('[GameEngine] игрок: ', userId, ', добавлен в сессию: ', this.roomId);
    }

    public removePlayer(userId: string): boolean {
        this.players.delete(userId);
        this.networkCallbacks.delete(userId);
        this.playerInputs.delete(userId);
        console.log('[GameEngine] игрок: ', userId, ', удалён из сессии: ', this.roomId);
        return this.players.size === 0;
    }

    public pushInput(userId: string, actionData: PlayerAction) {
        this.playerInputs.set(userId, actionData);
    }

    private startGameLoop() {
        this.gameLoopInterval = setInterval(() => {
            this.update();
        }, this.TICK_TIME);
        console.log('[GameEngine] сессия:', this.roomId, " запущена");
    }

    private update() {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;

        // 1. Разгребаем накопленные инпуты игроков
        this.processInputs();

        // Группируем активных игроков по комнатам, чтобы обновлять только те комнаты, где кто-то есть
        const activeRooms = new Map<string, { rx: number, ry: number, players: Player[], roomState: ServerRoomState }>();
        for (const player of this.players.values()) {
            const rx = player.currentRoomX;
            const ry = player.currentRoomY;
            const roomState = this.floorMap[ry][rx];
            if (roomState) {
                const key = `${rx},${ry}`;
                if (!activeRooms.has(key)) {
                    activeRooms.set(key, { rx, ry, players: [], roomState });
                }
                activeRooms.get(key)!.players.push(player);
            }
        }

        // 4. Обновляем ИИ монстров и проверяем коллизии в каждой активной комнате отдельно
        for (const active of activeRooms.values()) {
            const room = active.roomState;
            const playersInRoom = active.players;

            for (const enemy of room.enemies) {
                enemy.updateEntity(deltaTime);
                enemy.updateTarget(playersInRoom);
            }

            const bulletsInRoom = this.bullets.filter(b => b.currentRoomX === active.rx && b.currentRoomY === active.ry);
            const areDoorsOpen = room.enemies.length === 0;

            CollisionEngine.processCollisions(
                bulletsInRoom,
                playersInRoom,
                room.enemies,
                this.roomWidth,
                this.roomHeight,
                room.hasDoors,
                room.obstacles,
                room.chests,
                areDoorsOpen
            );

            if (room.enemies.length === 0 && !room.isClear) {
                room.isClear = true;
                console.log(`[GameEngine] Комната [${active.rx}, ${active.ry}] зачищена! Двери открыты.`);
            }
        }

        // 2. Двигаем игроков
        for (const player of this.players.values()) {
            player.updateEntity(deltaTime);
            this.checkRoomTransition(player);
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

        // 5. Отправляем индивидуальные снапшоты игрокам в зависимости от их текущей комнаты
        this.broadcastState();
    }

    private checkRoomTransition(player: Player) {
        const rx = player.currentRoomX;
        const ry = player.currentRoomY;
        const room = this.floorMap[ry][rx];
        if (!room) return;

        // Если в комнате есть враги — двери заперты, уйти нельзя!
        if (room.enemies.length > 0) {
            return;
        }

        const padding = 15;
        let nextX = rx;
        let nextY = ry;
        let spawnX = player.x;
        let spawnY = player.y;
        let isTransition = false;

        // Проверяем выход за границы экрана с учетом наличия дверей в этой комнате
        if (player.y < padding && room.hasDoors.Top) {
            nextY -= 1;
            spawnY = this.roomHeight - player.height / 2;
            isTransition = true;
        } else if (player.y > this.roomHeight - padding && room.hasDoors.Bottom) {
            nextY += 1;
            spawnY = player.height / 2;
            isTransition = true;
        } else if (player.x < padding && room.hasDoors.Left) {
            nextX -= 1;
            spawnX = this.roomWidth - player.width / 2;
            isTransition = true;
        } else if (player.x > this.roomWidth - padding && room.hasDoors.Right) {
            nextX += 1;
            spawnX = player.width / 2;
            isTransition = true;
        }

        if (isTransition) {
            if (nextX >= 0 && nextX < MapGenerator.MATRIX_SIZE &&
                nextY >= 0 && nextY < MapGenerator.MATRIX_SIZE &&
                this.floorMap[nextY][nextX] !== null) {

                player.currentRoomX = nextX;
                player.currentRoomY = nextY;
                player.x = spawnX;
                player.y = spawnY;
                player.vx = 0;
                player.vy = 0;

                // Удаляем пули, которые принадлежали этому игроку в старой комнате
                //this.bullets = this.bullets.filter(b => b.ownerId !== player.id);

                console.log(`[GameRoom] Игрок ${player.name} перешел в комнату [${nextX}, ${nextY}]`);
            }
        }
    }

    private processInputs() {
        for (const [userId, input] of this.playerInputs.entries()) {
            const player = this.players.get(userId);
            if (!player) continue;

            let vx = 0;
            let vy = 0;
            if (input.keys?.up) vy = -1;
            if (input.keys?.down) vy = 1;
            if (input.keys?.left) vx = -1;
            if (input.keys?.right) vx = 1;

            player.setDirection(vx, vy);

            if (input.keys?.attack) {
                const activeWeapon = player.getActiveWeapon();
                const now = performance.now();
                const dir = this.getDirectionToClosestEnemy(player);
                this.spawnProjectile(player, activeWeapon, dir.vx, dir.vy, now);
            }
        }
    }

    private spawnProjectile(
        owner: Player | Enemy,
        weapon: Weapon,
        dirX: number,
        dirY: number,
        currentTime: number
    ): void {
        if (!weapon.canFire(currentTime)) {
            return;
        }

        const prefix = owner.type === 'player' ? 'bullet' : 'bullet_enemy';
        const projectileId = IdGenerator.generateId(prefix);

        const projectile = weapon.fire(
            projectileId,
            owner.type as 'player' | 'enemy',
            owner.id,
            owner.x,
            owner.y,
            dirX,
            dirY,
            currentTime
        );

        if (projectile) {
            projectile.currentRoomX = owner.currentRoomX;
            projectile.currentRoomY = owner.currentRoomY;
            this.bullets.push(projectile);
        }
    }

    private getDirectionToClosestEnemy(player: Player): { vx: number, vy: number } {
        const room = this.floorMap[player.currentRoomY][player.currentRoomX];
        if (!room || room.enemies.length === 0) {
            return { vx: 1, vy: 0 };
        }

        let closestEnemy = null;
        let minDistance = Infinity;

        for (const enemy of room.enemies) {
            if (enemy.hp <= 0) continue;
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance) {
                minDistance = distance;
                closestEnemy = enemy;
            }
        }

        if (!closestEnemy) return { vx: 1, vy: 0 };

        const dx = closestEnemy.x - player.x;
        const dy = closestEnemy.y - player.y;
        const len = Math.sqrt(dx * dx + dy * dy);

        if (len === 0) return { vx: 1, vy: 0 };
        return { vx: dx / len, vy: dy / len };
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

                    console.log('asdasdsa');

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

                    room.chests = chests.map(c =>
                        GridMapper.mapChestToBaseNetworkEntity(
                            c.id,
                            c.gridX,
                            c.gridY,
                            RoomGridGenerator.CELL_SIZE,
                            'orange'
                        )
                    );
                }
            }
        }
    }

    private broadcastState() {
        if (this.players.size === 0) return;

        for (const [userId, player] of this.players.entries()) {
            const rx = player.currentRoomX;
            const ry = player.currentRoomY;
            const room = this.floorMap[ry][rx];

            if (!room) continue;

            // Собираем снапшот только для той комнаты, где стоит этот игрок
            const snapshot: GameSnapshot = {
                players: Array.from(this.players.values())
                    .filter(p => p.currentRoomX === rx && p.currentRoomY === ry)
                    .map(p => ({
                        id: p.id,
                        x: p.x,
                        y: p.y,
                        hp: p.hp,
                        maxHp: p.maxHp,
                        mana: p.mana,
                        maxMana: p.maxMana,
                        width: p.width,
                        height: p.height,
                        sprite: p.sprite
                    })),
                room: room,
                bullets: this.bullets
                    .filter(b => b.currentRoomX === rx && b.currentRoomY === ry)
                    .map(b => ({
                        id: b.id,
                        x: b.x,
                        y: b.y,
                        width: b.width,
                        height: b.height,
                        sprite: b.sprite
                    })),
            };

            const sendEmit = this.networkCallbacks.get(userId);
            if (sendEmit) {
                sendEmit(snapshot);
            }
        }
    }

    public stop() {
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
            console.log('[GameEngine] сессия:', this.roomId, " остановлена");
        }
    }

    private populateDungeonWithEnemies() {
        for (let y = 0; y < MapGenerator.MATRIX_SIZE; y++) {
            for (let x = 0; x < MapGenerator.MATRIX_SIZE; x++) {
                const room = this.floorMap[y][x];

                if (room && room.type !== 'Start') {
                    const enemyCount = 1 + Math.floor(Math.random() * 3);

                    for (let i = 0; i < enemyCount; i++) {
                        const enemyId = IdGenerator.generateId('lizard');
                        const padding = 100;
                        const randomX = padding + Math.random() * (GameEngine.ROOM_WIDTH - padding * 2);
                        const randomY = padding + Math.random() * (GameEngine.ROOM_HEIGHT - padding * 2);
                        const lizardBite = new Weapon(`bite_${enemyId}`, "Укус завра", STAFF);
                        const newLizard = new Enemy(
                            enemyId,
                            randomX,
                            randomY,
                            WARRIOR_PRESET_LIZARD,
                            lizardBite
                        );

                        room.enemies.push(newLizard);
                    }
                }
            }
        }
        console.log(`[GameEngine] Все комнаты лабиринта успешно заселены ящерами!`);
    }
}