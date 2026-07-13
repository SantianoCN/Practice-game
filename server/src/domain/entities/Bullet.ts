import MoveableEntity from './MoveableEntity';
import { WeaponConfig } from '../../config/types';

export default class Bullet extends MoveableEntity {
    public ownerId: string;
    public ownerType: 'player' | 'enemy';
    public damage: number;
    public range: number;
    public distanceTraveled: number;
    public isDestroyed: boolean;

    constructor(id: string, ownerType: 'player' | 'enemy', ownerId: string, startX: number, startY: number, targetVx: number, targetVy: number, config: WeaponConfig) {
        super(id, 'projectile', startX, startY, 8, 8);
        this.vx = targetVx;
        this.vy = targetVy;
        this.ownerType = ownerType;
        this.ownerId = ownerId;
        
        this.damage = config.damage;
        this.range = config.range;
        this.speed = config.speed;
        
        this.distanceTraveled = 0;
        this.isDestroyed = false;
        this.spriteKey = 'red_ball';
    }

    override updatePosition(deltaTime: number): void {
        if (this.isDestroyed) return;

        const movementLength = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        
        if (movementLength > 0) {
            const stepX = (this.vx / movementLength) * this.speed * deltaTime;
            const stepY = (this.vy / movementLength) * this.speed * deltaTime;
            
            this.x += stepX;
            this.y += stepY;

            this.distanceTraveled += Math.sqrt(stepX * stepX + stepY * stepY);
        }

        if (this.distanceTraveled >= this.range) {
            this.destroy();
        }
    }

    public destroy(): void {
        this.isDestroyed = true;
    }
}