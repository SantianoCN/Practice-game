"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapGenerator = void 0;
const Room_1 = require("../entities/Room");
const Enemy_1 = require("../entities/Enemy");
const Obstacle_1 = require("../entities/Obstacle");
const Chest_1 = require("../entities/Chest");
const Weapon_1 = require("../entities/Weapon");
const EntityFactory_1 = require("../factories/EntityFactory");
const RoomTemplates_1 = require("./RoomTemplates");
const shared_1 = require("@game/shared");
class MapGenerator {
    gridSize;
    targetRoomCount;
    roomWidth;
    roomHeight;
    generateId;
    getChestPreset;
    grid = [];
    roomsCreated = [];
    CELL_SIZE = shared_1.GAME_CONFIG.CELL_SIZE;
    constructor(gridSize, targetRoomCount, roomWidth, roomHeight, generateId, getChestPreset) {
        this.gridSize = gridSize;
        this.targetRoomCount = targetRoomCount;
        this.roomWidth = roomWidth;
        this.roomHeight = roomHeight;
        this.generateId = generateId;
        this.getChestPreset = getChestPreset;
    }
    generateLobby() {
        this.grid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(null));
        this.roomsCreated = [];
        const startX = Math.floor(this.gridSize / 2);
        const startY = Math.floor(this.gridSize / 2);
        const lobbyRoom = new Room_1.Room(startX, startY, 'Start', 0);
        lobbyRoom.isClear = true;
        lobbyRoom.hasDoors = { Top: false, Bottom: false, Left: false, Right: false };
        this.grid[startY][startX] = lobbyRoom;
        this.roomsCreated.push(lobbyRoom);
        return this.grid;
    }
    generate() {
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
    buildLayout(startX, startY, minRooms, maxRooms) {
        while (this.roomsCreated.length < minRooms) {
            this.grid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(null));
            this.roomsCreated = [];
            this.addRoom(startX, startY, 'Start');
            const queue = [{ x: startX, y: startY }];
            const targetCount = Math.floor(Math.random() * (maxRooms - minRooms + 1)) + minRooms;
            while ((this.roomsCreated.length < targetCount) && (queue.length > 0)) {
                const elementIndex = Math.floor(Math.random() * queue.length);
                const lastIndex = queue.length - 1;
                [queue[elementIndex], queue[lastIndex]] = [queue[lastIndex], queue[elementIndex]];
                const currentCoord = queue.pop();
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
    addRoom(x, y, type) {
        const center = Math.floor(this.gridSize / 2);
        const distance = Math.abs(x - center) + Math.abs(y - center);
        const room = new Room_1.Room(x, y, type, distance);
        this.grid[y][x] = room;
        this.roomsCreated.push(room);
    }
    canCreateRoom(x, y) {
        if (x >= this.gridSize || x < 0 || y >= this.gridSize || y < 0)
            return false;
        if (this.grid[y][x] !== null)
            return false;
        if (this.countNeighbors(x, y) > 1)
            return false;
        return true;
    }
    assignRoomTypes() {
        const sortedByDistance = [...this.roomsCreated].sort((a, b) => b.distanceToSpawn - a.distanceToSpawn);
        if (sortedByDistance.length > 0) {
            sortedByDistance[0].type = 'Boss';
        }
        const deadEnds = this.roomsCreated.filter(r => r.type === 'Normal' && this.countNeighbors(r.gridX, r.gridY) === 1);
        if (deadEnds.length > 0) {
            deadEnds[0].type = 'Treasure';
        }
        else if (sortedByDistance.length > 1) {
            sortedByDistance[1].type = 'Treasure';
        }
    }
    connectDoors() {
        for (const room of this.roomsCreated) {
            const x = room.gridX;
            const y = room.gridY;
            if (y > 0 && this.grid[y - 1][x] !== null)
                room.hasDoors.Top = true;
            if (y < this.gridSize - 1 && this.grid[y + 1][x] !== null)
                room.hasDoors.Bottom = true;
            if (x > 0 && this.grid[y][x - 1] !== null)
                room.hasDoors.Left = true;
            if (x < this.gridSize - 1 && this.grid[y][x + 1] !== null)
                room.hasDoors.Right = true;
        }
    }
    populateRooms() {
        for (const room of this.roomsCreated) {
            if (room.type === 'Start' || room.type === 'Shop') {
                room.isClear = true;
                continue;
            }
            const matchingTemplates = RoomTemplates_1.ROOM_TEMPLATES.filter(t => t.type === room.type);
            if (matchingTemplates.length > 0) {
                const template = matchingTemplates[Math.floor(Math.random() * matchingTemplates.length)];
                this.applyTemplate(room, template);
            }
            if (room.type === 'Boss') {
                this.spawnBoss(room);
            }
            else if (room.type === 'Normal') {
                const enemyCount = Math.floor(Math.random() * 3) + 2;
                for (let i = 0; i < enemyCount; i++) {
                    this.spawnEnemy(room);
                }
            }
            else if (room.type === 'Treasure') {
                room.isClear = true;
            }
        }
    }
    applyTemplate(room, template) {
        for (const obs of template.obstacles) {
            const width = (obs.endX - obs.startX + 1) * this.CELL_SIZE;
            const height = (obs.endY - obs.startY + 1) * this.CELL_SIZE;
            const x = obs.startX * this.CELL_SIZE + width / 2;
            const y = obs.startY * this.CELL_SIZE + height / 2;
            const obstacle = new Obstacle_1.Obstacle(this.generateId('obs'), x, y, width, height, 'stone_block');
            room.obstacles.push(obstacle);
        }
        for (const ch of template.chests) {
            const preset = this.getChestPreset(ch.presetId);
            const width = preset ? preset.width : 28;
            const height = preset ? preset.height : 28;
            const x = ch.gridX * this.CELL_SIZE + width / 2;
            const y = ch.gridY * this.CELL_SIZE + height / 2;
            const chest = new Chest_1.Chest(this.generateId('chest'), x, y, width, height, ch.gridX, ch.gridY, ch.presetId);
            room.chests.push(chest);
        }
    }
    spawnEnemy(room) {
        const padding = 150;
        const x = padding + Math.random() * (this.roomWidth - padding * 2);
        const y = padding + Math.random() * (this.roomHeight - padding * 2);
        let chance = Math.random() > 0.5;
        const stats = chance ? shared_1.MAGE_PRESET_LIZARD : shared_1.WARRIOR_PRESET_LIZARD;
        chance = Math.random() > 0.5;
        let weaponConfig;
        if (stats === shared_1.MAGE_PRESET_LIZARD) {
            weaponConfig = chance ? shared_1.STAFF : shared_1.ICE_STAFF;
        }
        else {
            weaponConfig = chance ? shared_1.SWORD : shared_1.AXE;
        }
        const enemy = EntityFactory_1.EntityFactory.createEnemy(x, y, stats, weaponConfig, this.generateId);
        room.enemies.push(enemy);
    }
    spawnBoss(room) {
        const x = this.roomWidth / 2;
        const y = this.roomHeight / 2;
        const bossStats = { ...shared_1.WARRIOR_PRESET_LIZARD };
        bossStats.maxHp = 300;
        bossStats.speed = 120;
        bossStats.visualId = 'red_box';
        const bossWeaponConfig = { ...shared_1.STAFF, cooldownMs: 500, projectile: shared_1.FIREBALL };
        const weapon = new Weapon_1.Weapon(this.generateId('wpn'), 'wpn_fire_staff', 'Посох Ящера-Императора', bossWeaponConfig);
        const boss = new Enemy_1.Enemy(this.generateId('boss'), x, y, bossStats, weapon);
        boss.width = 64;
        boss.height = 64;
        room.enemies.push(boss);
    }
    countNeighbors(x, y) {
        let count = 0;
        if (y > 0 && this.grid[y - 1][x] !== null)
            count++;
        if (y < this.gridSize - 1 && this.grid[y + 1][x] !== null)
            count++;
        if (x > 0 && this.grid[y][x - 1] !== null)
            count++;
        if (x < this.gridSize - 1 && this.grid[y][x + 1] !== null)
            count++;
        return count;
    }
}
exports.MapGenerator = MapGenerator;
