import { WeaponConfig } from '../config/types';
import Bullet from '../entities/Bullet';

export default class Weapon {
    public id: string;
    public name: string;
    private damage: number;
    private range: number;
    private fireRateMs: number;
    private bulletSpeed: number;
    private lastFiredTime: number;

    constructor(id: string, name: string, config: WeaponConfig) {
        this.id = id;
        this.name = name;
        
        this.damage = config.damage;
        this.range = config.range;
        this.fireRateMs = config.cooldownMs;
        this.bulletSpeed = config.speed;
        
        this.lastFiredTime = 0;
    }

    public canFire(currentTime: number): boolean {
        return currentTime - this.lastFiredTime >= this.fireRateMs;
    }

    public fire(bulletId: string, ownerType: 'player' | 'enemy', ownerId: string, startX: number, startY: number, targetVx: number, targetVy: number, currentTime: number): Bullet | null {
        if (!this.canFire(currentTime)) {
            return null;
        }

        this.lastFiredTime = currentTime;

        const bulletConfig: WeaponConfig = {
            damage: this.damage,
            range: this.range,
            speed: this.bulletSpeed,
            cooldownMs: this.fireRateMs
        };

        return new Bullet(bulletId, ownerType, ownerId, startX, startY, targetVx, targetVy, bulletConfig);
    }
}