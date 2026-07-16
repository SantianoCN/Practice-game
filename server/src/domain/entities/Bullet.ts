import { ProjectileConfigDTO } from '@game/shared';
import { MoveableEntity } from './BaseEntities';

export class Bullet extends MoveableEntity {
    public distanceTraveled: number = 0;
    public isDestroyed: boolean = false;
    public damage: number;
    public range: number;

    constructor(
        id: string, 
        public ownerId: string, 
        public ownerType: 'player' | 'enemy',
        x: number, y: number, 
        dirX: number, dirY: number, 
        config: ProjectileConfigDTO
    ) {
        super(id, x, y, 8, 8, config.speed, config.sprite);
        this.vx = dirX;
        this.vy = dirY;
        this.damage = config.damage;
        this.range = config.range;
    }

    public override updatePosition(deltaTime: number): void {
        if (this.isDestroyed) return;

        const prevX = this.x;
        const prevY = this.y;
        super.updatePosition(deltaTime);
        
        this.distanceTraveled += Math.hypot(this.x - prevX, this.y - prevY);
        if (this.distanceTraveled >= this.range) {
            this.isDestroyed = true;
        }
    }
}