import { WeaponStats, EntityType } from '@game/shared';
import { Bullet } from './Bullet';

export class Weapon {
    private lastFiredTime: number = 0;

    constructor(
        public id: string,
        public name: string,
        public config: WeaponStats
    ) {}

    public canFire(currentTime: number): boolean {
        return currentTime - this.lastFiredTime >= this.config.cooldownMs;
    }

    public fire(
        bulletId: string, ownerId: string, 
        ownerType: EntityType,
        startX: number, startY: number, 
        dirX: number, dirY: number, 
        currentTime: number
    ): Bullet | null {
        if (!this.canFire(currentTime)) return null;
        
        this.lastFiredTime = currentTime;
        return new Bullet(bulletId, ownerId, ownerType, startX, startY, dirX, dirY, this.config.projectile);
    }
}