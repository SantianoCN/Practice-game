import { WeaponConfig, ProjectileConfig } from '../../../../shared/gameTypes';
import Bullet from '../entities/Bullet';

export default class Weapon {
    public id: string;
    public name: string;
    private fireRateMs: number;
    private projectile: ProjectileConfig;
    private lastFiredTime: number;
    private sprite: string;

    constructor(id: string, name: string, config: WeaponConfig) {
        this.id = id;
        this.name = name;
        this.projectile = config.projectile;
        this.fireRateMs = config.cooldownMs;
        this.sprite = config.sprite;
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

        const bulletConfig: ProjectileConfig = {
            damage: this.projectile.damage,
            range: this.projectile.range,
            speed: this.projectile.speed,
            sprite: this.projectile.sprite
        };

        return new Bullet(bulletId, ownerType, ownerId, startX, startY, targetVx, targetVy, bulletConfig);
    }
}