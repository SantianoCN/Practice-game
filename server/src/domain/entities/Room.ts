import { Enemy } from './Enemy';
import { Chest, DroppedItem } from './Chest';
import { Obstacle } from './Obstacle';
import { Bullet } from './Bullet';
import { Direction, RoomType } from '@game/shared';
import { SpatialGrid } from '../physics/SpatialGrid';

export class Room {
    public isClear: boolean = false;
    public hasDoors: Record<Direction, boolean> = { Top: false, Bottom: false, Left: false, Right: false };
    
    public enemies: Enemy[] = [];
    public chests: Chest[] = [];
    public obstacles: Obstacle[] = [];
    public droppedItems: DroppedItem[] = [];
    public bullets: Bullet[] = [];

    private obstacleGrid: SpatialGrid<Obstacle> | null = null;

    constructor(
        public gridX: number,
        public gridY: number,
        public type: RoomType,
        public distanceToSpawn: number
    ) {}

    public getObstacleGrid(): SpatialGrid<Obstacle> {
        if (!this.obstacleGrid) {
            this.obstacleGrid = new SpatialGrid<Obstacle>(100);
            for (const obs of this.obstacles) {
                this.obstacleGrid.insert(obs);
            }
        }
        return this.obstacleGrid;
    }

    public checkClearCondition(): void {
        if (this.isClear) return;
        const allEnemiesDead = this.enemies.every(e => e.isDead());
        if (allEnemiesDead) {
            this.isClear = true;
        }
    }

    public cleanupDeadEntities(): void {
        this.enemies = this.enemies.filter(e => !e.isDead());
        this.bullets = this.bullets.filter(b => !b.isDestroyed);
    }
}