"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
const SpatialGrid_1 = require("../physics/SpatialGrid");
class Room {
    gridX;
    gridY;
    type;
    distanceToSpawn;
    isClear = false;
    hasDoors = { Top: false, Bottom: false, Left: false, Right: false };
    enemies = [];
    chests = [];
    obstacles = [];
    droppedItems = [];
    bullets = [];
    obstacleGrid = null;
    constructor(gridX, gridY, type, distanceToSpawn) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.type = type;
        this.distanceToSpawn = distanceToSpawn;
    }
    getObstacleGrid() {
        if (!this.obstacleGrid) {
            this.obstacleGrid = new SpatialGrid_1.SpatialGrid(100);
            for (const obs of this.obstacles) {
                this.obstacleGrid.insert(obs);
            }
        }
        return this.obstacleGrid;
    }
    checkClearCondition() {
        if (this.isClear)
            return;
        const allEnemiesDead = this.enemies.every(e => e.isDead());
        if (allEnemiesDead) {
            this.isClear = true;
        }
    }
    cleanupDeadEntities() {
        this.enemies = this.enemies.filter(e => !e.isDead());
        this.bullets = this.bullets.filter(b => !b.isDestroyed);
    }
}
exports.Room = Room;
