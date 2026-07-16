import { RoomType, Direction } from '@game/shared';
import { Enemy } from '../entities/Enemy';
import { Chest, DroppedItem } from '../entities/Chest';
import { Obstacle } from '../entities/Obstacle';
import { Bullet } from '../entities/Bullet';

export class Room {
    public isClear: boolean = false;
    public hasDoors: Record<Direction, boolean> = { Top: false, Bottom: false, Left: false, Right: false };
    
    public enemies: Enemy[] = [];
    public chests: Chest[] = [];
    public obstacles: Obstacle[] = [];
    public droppedItems: DroppedItem[] = [];
    public bullets: Bullet[] = [];

    constructor(
        public gridX: number,
        public gridY: number,
        public type: RoomType,
        public distanceToSpawn: number
    ) {}

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