// src/managers/GameEngine.ts
import Player from '../entities/Player';
import Enemy from '../entities/Enemy';
import Bullet from '../entities/Bullet';
import './CollisionManager';
import { WARRIOR_PRESET, MAGE_PRESET } from '../config/playerPresets';
import { WARRIOR_PRESET_LIZARD } from '../config/enemyPresets';
import { FIREBALL } from '../config/weaponPresets';
import Weapon from '../items/Weapon';
import IdGenerator from '../utils/IDGenerator';
import CollisionManager from './CollisionManager';
import { PlayerAction, GameSnapshot } from '../../../shared/gameTypes';

export default class GameEngine {
    public roomId: string;
    
    // Списки всех сущностей в этой конкретной комнате
    private players: Map<string, Player>;
    private enemies: Enemy[];
    private bullets: Bullet[];
    private lastFrameTime: number = Date.now();
    private roomWidth: number;
    private roomHeight: number;


    // Очередь входящих инпутов, которые накопились за 16мс (между тиками)
    private inputQueue: Map<string, PlayerAction>;

    // Колбэки для отправки данных обратно в сеть через сокеты
    private networkCallbacks: Map<string, (snapshot: GameSnapshot) => void>;

    private gameLoopInterval: ReturnType<typeof setInterval> | null = null;
    private readonly TICK_RATE = 60; // 60 тиков в секунду
    private readonly TICK_TIME = 1000 / this.TICK_RATE; // ~16.67 миллисекунд
    private static readonly ROOM_WIDTH = 1000;
    private static readonly ROOM_HEIGHT = 1000;

    constructor(roomId: string) {
        this.roomId = roomId;
        this.players = new Map();
        this.enemies = [];
        this.bullets = [];
        this.inputQueue = new Map();
        this.networkCallbacks = new Map();
        this.roomHeight = GameEngine.ROOM_HEIGHT;
        this.roomWidth = GameEngine.ROOM_WIDTH;

        // Запускаем бесконечный конвейер игры
        this.startGameLoop();
        
        // Спавним парочку тестовых монстров для затравки
        this.spawnTestEnemies();
    }

    // Добавление игрока в игровой мир
    public addPlayer(userId: string, name: string, archetype: 'warrior' | 'mage', emitCallback: (snapshot: GameSnapshot) => void) {
        const preset = archetype === 'mage' ? MAGE_PRESET : WARRIOR_PRESET;
        
        // Создаем физический объект игрока (Оружие добавим чуть позже при интеграции)
        // Ставим его в центр карты (координаты 400, 400)
        const weaponId = IdGenerator.generateId('weapon');
        const startWeapon = new Weapon(weaponId, "Огненый посох", FIREBALL);
        const newPlayer = new Player(userId, name, archetype, 400, 400, preset, startWeapon);
        
        this.players.set(userId, newPlayer);
        this.networkCallbacks.set(userId, emitCallback);
    }

    // Удаление игрока (вышел)
    // возвращает true, если комната пуста
    public removePlayer(userId: string): boolean {
        this.players.delete(userId);
        this.networkCallbacks.delete(userId);
        this.inputQueue.delete(userId);
        return this.players.size === 0;
    }

    // Сюда GameManager складывает нажатия кнопок от сокетов
    public pushInput(userId: string, actionData: PlayerAction) {
        this.inputQueue.set(userId, actionData);
    }

    // Главный цикл (Game Loop)
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

        // 5. Проверяем коллизии (врезания пули в ящеров) -> Сюда подключим CollisionEngine
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

            // Пример обработки движения: input.keys = { up: true, down: false... }
            let vx = 0;
            let vy = 0;
            if (input.keys?.up) vy = -1;
            if (input.keys?.down) vy = 1;
            if (input.keys?.left) vx = -1;
            if (input.keys?.right) vx = 1;

            player.setDirection(vx, vy);

            // Если прилетел флаг выстрела
            if (input.keys?.shoot) {
                const bulletId = IdGenerator.generateId('bullet');
                player.inventory[player.currentWeaponId].fire(bulletId,'player', player.id, player.x, player.y, 1, 1, Date.now());
            }
        }
        // Очищаем инпуты после обработки кадра
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

    // Сборка слепка экрана (Snapshot) и отправка в сеть
    private broadcastState() {
        if (this.players.size === 0) return;

        // Собираем минимальные данные для отрисовки на клиенте
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

        // 2. Выбираем случайную точку на карте, но не у самого края
        const padding = 100;
        const randomX = padding + Math.random() * (GameEngine.ROOM_WIDTH - padding * 2);
        const randomY = padding + Math.random() * (GameEngine.ROOM_HEIGHT - padding * 2);

        // 3. Создаем "оружие" ближнего боя для укусов (урон 15, кулдаун 1 секунда)
        const lizardBite = new Weapon(`bite_${enemyId}`, "Укус завра", FIREBALL);

        // 4. Инициализируем объект ящера
        // Передаем: id, x, y, width, height, hp, speed, spriteKey, weapon
        const newLizard = new Enemy(
            enemyId,
            'warrior',
            randomX,
            randomY,
            WARRIOR_PRESET_LIZARD,
            lizardBite   // оружие для коллизий ближнего боя
        );

        // 5. Толкаем его в наш массив активных монстров
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