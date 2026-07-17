import { Room } from '../entities/Room';
import { Enemy } from '../entities/Enemy';
import { Obstacle } from '../entities/Obstacle';
import { Chest, LootItem } from '../entities/Chest';
import { Weapon } from '../entities/Weapon';
import { ROOM_TEMPLATES, RoomTemplate } from './roomTemplates';
import { AXE, FIREBALL, ICE_STAFF, MAGE_PRESET_LIZARD, STAFF, SWORD, WARRIOR_PRESET_LIZARD,
    GAME_CONFIG, IDGenerator, RoomType
 } from '@game/shared';

interface Coords {
    x: number;
    y: number;
}

export class MapGenerator {
    private grid: (Room | null)[][] = [];
    private roomsCreated: Room[] = [];
    private readonly CELL_SIZE = GAME_CONFIG.CELL_SIZE;

    constructor(
        private gridSize: number,
        private targetRoomCount: number,
        private roomWidth: number,
        private roomHeight: number,
        private generateId: IDGenerator
    ) {}

    public generate(): (Room | null)[][] {
        this.grid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(null));
        this.roomsCreated = [];

        const startX = Math.floor(this.gridSize / 2);
        const startY = Math.floor(this.gridSize / 2);

        this.buildLayout(startX, startY, Math.floor(this.targetRoomCount / 2), this.targetRoomCount);

        this.assignRoomTypes();

        this.connectDoors();

        this.populateRooms();

        return this.grid;
    }

    private buildLayout(startX: number, startY: number, minRooms: number, maxRooms: number): void {
        while (this.roomsCreated.length < minRooms) {
            this.grid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(null));
            this.roomsCreated = [];
            this.addRoom(startX, startY, 'Start');

            const queue: Coords[] = [{ x: startX, y: startY }];
            const targetCount = Math.floor(Math.random() * (maxRooms - minRooms + 1)) + minRooms;

            while ((this.roomsCreated.length < targetCount) && (queue.length > 0)) {
                const elementIndex = Math.floor(Math.random() * queue.length);
                const lastIndex = queue.length - 1;
                [queue[elementIndex], queue[lastIndex]] = [queue[lastIndex], queue[elementIndex]];
                const currentCoord = queue.pop()!;

                let roomCreated = false;

                const directions = [
                    { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, 
                    { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
                ].sort(() => Math.random() - 0.5);

                for (const move of directions) {
                    const nextX = currentCoord.x + move.dx;
                    const nextY = currentCoord.y + move.dy;

                    if (this.canCreateRoom(nextX, nextY)) {
                        this.addRoom(nextX, nextY, 'Normal');
                        queue.push({ x: nextX, y: nextY });
                        roomCreated = true;
                        break;
                    }
                }

                if (roomCreated && this.countNeighbors(currentCoord.x, currentCoord.y) < 3) {
                    queue.push(currentCoord);
                }
            }
        }
    }

    private addRoom(x: number, y: number, type: RoomType): void {
        const center = Math.floor(this.gridSize / 2);
        const distance = Math.abs(x - center) + Math.abs(y - center);
        const room = new Room(x, y, type, distance);
        this.grid[y][x] = room;
        this.roomsCreated.push(room);
    }

    private canCreateRoom(x: number, y: number): boolean {
        if (x >= this.gridSize || x < 0 || y >= this.gridSize || y < 0) return false;
        if (this.grid[y][x] !== null) return false;
        if (this.countNeighbors(x, y) > 1) return false;
        return true;
    }

    private assignRoomTypes(): void {
        const sortedByDistance = [...this.roomsCreated].sort((a, b) => b.distanceToSpawn - a.distanceToSpawn);

        if (sortedByDistance.length > 0) {
            sortedByDistance[0].type = 'Boss';
        }

        const deadEnds = this.roomsCreated.filter(r => 
            r.type === 'Normal' && this.countNeighbors(r.gridX, r.gridY) === 1
        );

        if (deadEnds.length > 0) {
            deadEnds[0].type = 'Treasure';
        } else if (sortedByDistance.length > 1) { 
            sortedByDistance[1].type = 'Treasure';
        }
    }

    private connectDoors(): void {
        for (const room of this.roomsCreated) {
            const x = room.gridX;
            const y = room.gridY;

            if (y > 0 && this.grid[y - 1][x] !== null) room.hasDoors.Top = true;
            if (y < this.gridSize - 1 && this.grid[y + 1][x] !== null) room.hasDoors.Bottom = true;
            if (x > 0 && this.grid[y][x - 1] !== null) room.hasDoors.Left = true;
            if (x < this.gridSize - 1 && this.grid[y][x + 1] !== null) room.hasDoors.Right = true;
        }
    }

    private populateRooms(): void {
        for (const room of this.roomsCreated) {
            if (room.type === 'Start' || room.type === 'Shop') {
                room.isClear = true;
                continue;
            }

            const matchingTemplates = ROOM_TEMPLATES.filter(t => t.type === room.type);
            
            if (matchingTemplates.length > 0) {
                const template = matchingTemplates[Math.floor(Math.random() * matchingTemplates.length)];
                this.applyTemplate(room, template);
            }

            if (room.type === 'Boss') {
                this.spawnBoss(room);
            } else if (room.type === 'Normal') {
                const enemyCount = Math.floor(Math.random() * 3) + 2; 
                for (let i = 0; i < enemyCount; i++) {
                    this.spawnEnemy(room);
                }
            } else if (room.type === 'Treasure') {
                room.isClear = true;
            }
        }
    }

    private applyTemplate(room: Room, template: RoomTemplate): void {
        for (const obs of template.obstacles) {
            const width = (obs.endX - obs.startX + 1) * this.CELL_SIZE;
            const height = (obs.endY - obs.startY + 1) * this.CELL_SIZE;
            
            const x = obs.startX * this.CELL_SIZE + width / 2;
            const y = obs.startY * this.CELL_SIZE + height / 2;

            const obstacle = new Obstacle(this.generateId('obs'), x, y, width, height, 'stone_block');
            room.obstacles.push(obstacle);
        }

        for (const ch of template.chests) {
            const width = this.CELL_SIZE * 2;
            const height = this.CELL_SIZE * 2;
            const x = ch.gridX * this.CELL_SIZE + width / 2;
            const y = ch.gridY * this.CELL_SIZE + height / 2;

            const lootItems: LootItem[] = ch.items.map(itemType => {
                if (itemType === 'weapon') {
                    const weapons = [SWORD, STAFF, ICE_STAFF, AXE];
                    const randomWpn = weapons[Math.floor(Math.random() * weapons.length)];
                    const weapon = new Weapon(
                        this.generateId('weapon'),
                        'weapon',
                        randomWpn
                    );
                    return { type: 'weapon', weapon: weapon };
                }
                return { type: 'gold', amount: Math.floor(Math.random() * 50) + 10 };
            });

            const chest = new Chest(this.generateId('chest'), x, y, width, height, ch.gridX, ch.gridY, lootItems);
            room.chests.push(chest);
        }
    }

    private spawnEnemy(room: Room): void {
        const padding = 150;
        const x = padding + Math.random() * (this.roomWidth - padding * 2);
        const y = padding + Math.random() * (this.roomHeight - padding * 2);

        const isMage = Math.random() > 0.5;
        const stats = isMage ? MAGE_PRESET_LIZARD : WARRIOR_PRESET_LIZARD;
        const weaponConfig = isMage ? STAFF : SWORD;
        
        const weapon = new Weapon(this.generateId('wpn'), 'Вражеское Оружие', weaponConfig);
        const enemy = new Enemy(this.generateId('enm'), x, y, stats, weapon);
        
        room.enemies.push(enemy);
    }

    private spawnBoss(room: Room): void {
        const x = this.roomWidth / 2;
        const y = this.roomHeight / 2;

        const bossStats = { ...WARRIOR_PRESET_LIZARD };
        bossStats.maxHp = 300; 
        bossStats.speed = 120;
        bossStats.visualId = 'red_box'; 

        const bossWeaponConfig = { ...STAFF, cooldownMs: 500, projectile: FIREBALL };
        const weapon = new Weapon(this.generateId('wpn'), 'Посох Ящера-Императора', bossWeaponConfig);
        
        const boss = new Enemy(this.generateId('boss'), x, y, bossStats, weapon);
        boss.width = 64; 
        boss.height = 64;

        room.enemies.push(boss);
    }

    private spawnObstacles(room: Room, count: number): void {
        for (let i = 0; i < count; i++) {
            const width = 64;
            const height = 64;
            const x = Math.random() > 0.5 ? 100 : this.roomWidth - 100;
            const y = Math.random() > 0.5 ? 100 : this.roomHeight - 100;

            const obstacle = new Obstacle(this.generateId('obs'), x, y, width, height, 'stone_block');
            room.obstacles.push(obstacle);
        }
    }

    private spawnChest(room: Room): void {
        const x = this.roomWidth / 2;
        const y = this.roomHeight / 2;
        
        const chest = new Chest(
            this.generateId('chest'), 
            x, y, 40, 40, 
            room.gridX, room.gridY, 
            [ { type: 'gold', amount: 100 } ] 
        );
        
        room.chests.push(chest);
    }

    private countNeighbors(x: number, y: number): number {
        let count = 0;
        if (y > 0 && this.grid[y - 1][x] !== null) count++;
        if (y < this.gridSize - 1 && this.grid[y + 1][x] !== null) count++;
        if (x > 0 && this.grid[y][x - 1] !== null) count++;
        if (x < this.gridSize - 1 && this.grid[y][x + 1] !== null) count++;
        return count;
    }
}