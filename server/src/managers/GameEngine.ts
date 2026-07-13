import Player from '../entities/Player';
import Enemy from '../entities/Enemy';
import Bullet from '../entities/Bullet';
import './CollisionManager';
import { WARRIOR_PRESET, MAGE_PRESET } from '../config/playerPresets';
import { WARRIOR_PRESET_LIZARD } from '../config/enemyPresets';
import { FIREBALL } from '../config/weaponPresets';
import Weapon from '../items/Weapon';
import { IdGenerator } from '../utils/IDGenerator';
import { MapGenerator } from '../utils/mapGenerator';
import { CollisionManager } from './CollisionManager';
import { PlayerAction, GameSnapshot, RoomState } from '../../../shared/gameTypes';

export class GameEngine {
    public roomId: string;
    
    private players: Map<string, Player>;
    private enemies: Enemy[];
    private bullets: Bullet[];
    private lastFrameTime: number = Date.now();
    private roomWidth: number;
    private roomHeight: number;

    private inputQueue: Map<string, PlayerAction>;
    private networkCallbacks: Map<string, (snapshot: GameSnapshot) => void>;

    private gameLoopInterval: ReturnType<typeof setInterval> | null = null;
    private readonly TICK_RATE = 60;
    private readonly TICK_TIME = 1000 / this.TICK_RATE;
    private static readonly ROOM_WIDTH = 1000;
    private static readonly ROOM_HEIGHT = 1000;
    private floorGenerator: MapGenerator;
    private floorMap: (RoomState | null)[][];

    constructor(roomId: string) {
        this.roomId = roomId;
        this.players = new Map();
        this.enemies = [];
        this.bullets = [];
        this.inputQueue = new Map();
        this.networkCallbacks = new Map();
        this.roomHeight = GameEngine.ROOM_HEIGHT;
        this.roomWidth = GameEngine.ROOM_WIDTH;
        this.floorGenerator = new MapGenerator();
        this.floorMap = this.floorGenerator.generate(5, 10);
        this.logFloorMap();

        this.startGameLoop();
        this.spawnTestEnemies();
    }

    private logFloorMap(): void {
        console.log(`\n[GameRoom] Сгенерирована карта этажа для комнаты: ${this.roomId}`);
        const mapRender = this.floorMap
            .map(row => row.map(cell => (cell !== null ? '██' : '░░')).join(' '))
            .join('\n');
        console.log(mapRender);
        console.log(`=============================================\n`);
    }

    public addPlayer(userId: string, name: string, archetype: 'warrior' | 'mage', emitCallback: (snapshot: GameSnapshot) => void) {
        const preset = archetype === 'mage' ? MAGE_PRESET : WARRIOR_PRESET;
        const weaponId = IdGenerator.generateId('weapon');
        const startWeapon = new Weapon(weaponId, "Огненый посох", FIREBALL);
        const newPlayer = new Player(userId, name, archetype, 400, 400, preset, startWeapon);
        
        this.players.set(userId, newPlayer);
        this.networkCallbacks.set(userId, emitCallback);
    }

    public removePlayer(userId: string): boolean {
        this.players.delete(userId);
        this.networkCallbacks.delete(userId);
        this.inputQueue.delete(userId);
        return this.players.size === 0;
    }

    public pushInput(userId: string, actionData: PlayerAction) {
        this.inputQueue.set(userId, actionData);
    }

    private startGameLoop() {
        this.gameLoopInterval = setInterval(() => {
            this.update();
        }, this.TICK_TIME);
    }

    // Один кадр жизни сервера (каждые 16.6 миллисекунд)
    private update() {
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;

        // 1. Разгребаем накопленные инпуты игроков
        this.processInputs();

        // 2. Двигаем игроков
        for (const player of this.players.values()) {
            player.updateEntity(deltaTime);
        }

        // 3. Двигаем пули (снаряды)
        for (const bullet of this.bullets.values()) {
            bullet.updatePosition(deltaTime);
        }

        const playersArray: Player[] = Array.from(this.players.values());
        // 4. Двигаем и обновляем ИИ монстров
        for (const enemy of this.enemies.values()) {
            enemy.updateEntity(deltaTime);
            enemy.updateTarget(playersArray);
        }

        // 5. Проверяем коллизии (врезания пули в ящеров)
        this.checkCollisions();
        this.bullets = this.bullets.filter(b => !b.isDestroyed);
        this.enemies = this.enemies.filter(e => e.hp > 0);

        // 6. Отправляем свежие координаты всем выжившим игрокам в комнате
        this.broadcastState();
    }

    private processInputs() {
        for (const [userId, input] of this.inputQueue.entries()) {
            const player = this.players.get(userId);
            if (!player) continue;

            let vx = 0;
            let vy = 0;
            if (input.keys?.up) vy = -1;
            if (input.keys?.down) vy = 1;
            if (input.keys?.left) vx = -1;
            if (input.keys?.right) vx = 1;

            player.setDirection(vx, vy);

            if (input.keys?.shoot) {
                const activeWeapon = player.getActiveWeapon();
                const now = Date.now();
                const dir = this.getDirectionToClosestEnemy(player);
                this.spawnProjectile(player, activeWeapon, dir.vx, dir.vy, now);
            }
        }
        this.inputQueue.clear();
    }

    private checkCollisions() {
        CollisionManager.processCollisions(this.bullets, 
            Array.from(this.players.values()), 
            this.enemies, 
            this.roomWidth, 
            this.roomHeight
        );
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
            this.bullets.push(projectile);
        }
    }

    private getDirectionToClosestEnemy(player: Player): { vx: number, vy: number } {
        if (this.enemies.length === 0) {
            return { vx: 1, vy: 0 };
        }

        let closestEnemy: Enemy | null = null;
        let minDistance = Infinity;

        for (const enemy of this.enemies) {
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

    private broadcastState() {
        if (this.players.size === 0) return;

        const snapshot: GameSnapshot = {
            players: Array.from(this.players.values()).map(p => ({ 
                id: p.id, 
                x: p.x, 
                y: p.y, 
                hp: p.hp, 
                maxHp: p.maxHp,
                mana: p.mana,
                maxMana: p.maxMana,
                sprite: p.spriteKey,
                width: p.width,
                height: p.height
            })),
            enemies: this.enemies.map(e => ({ 
                id: e.id, 
                x: e.x, 
                y: e.y, 
                hp: e.hp,
                maxHp: e.maxHp, 
                sprite: e.spriteKey,
                width: e.width,
                height: e.height
            })),
            bullets: this.bullets.map(b => ({ 
                id: b.id, 
                x: b.x, 
                y: b.y,
                width: b.width,
                height: b.height
            }))
        };

        for (const sendEmit of this.networkCallbacks.values()) {
            sendEmit(snapshot);
        }
    }

    private spawnTestEnemies() {
        const enemyId = IdGenerator.generateId('lizard');
        const padding = 100;
        const randomX = padding + Math.random() * (GameEngine.ROOM_WIDTH - padding * 2);
        const randomY = padding + Math.random() * (GameEngine.ROOM_HEIGHT - padding * 2);
        const lizardBite = new Weapon(`bite_${enemyId}`, "Укус завра", FIREBALL);
        const newLizard = new Enemy(
            enemyId,
            'warrior',
            randomX,
            randomY,
            WARRIOR_PRESET_LIZARD,
            lizardBite
        );

        this.enemies.push(newLizard);

        console.log(`[GameEngine] 🐊 Свежий ящер заспавнен! ID: ${enemyId} в координатах [${randomX}, ${randomY}]`);
    }

    public stop() {
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
        }
    }
}