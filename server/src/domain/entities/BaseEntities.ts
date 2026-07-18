import { BoundingBox, Archetype, EntityType } from '@game/shared';

export abstract class StaticEntity {
    constructor(
        public id: string,
        public x: number,
        public y: number,
        public width: number,
        public height: number,
        public visualId: string
    ) {}

    public getBounds(): BoundingBox {
        return {
            left: this.x - this.width / 2,
            right: this.x + this.width / 2,
            top: this.y - this.height / 2,
            bottom: this.y + this.height / 2
        };
    }
}

export abstract class MoveableEntity {
    constructor(
        public id: string,
        public x: number,
        public y: number,
        public width: number,
        public height: number,
        public speed: number,
        public visualId: string
    ) {}

    public vx: number = 0;
    public vy: number = 0;

    public updatePosition(deltaTime: number): void {
        const length = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (length > 0) {
            this.x += (this.vx / length) * this.speed * deltaTime;
            this.y += (this.vy / length) * this.speed * deltaTime;
        }
    }

    public getBounds(): BoundingBox {
        return {
            left: this.x - this.width / 2,
            right: this.x + this.width / 2,
            top: this.y - this.height / 2,
            bottom: this.y + this.height / 2
        };
    }
}

export abstract class LivingEntity extends MoveableEntity {
    public isInvulnerable: boolean = false;
    protected invulnTimer: number = 0;
    private static readonly INVULN_DURATION = 0.5;
    public abstract readonly entityType: EntityType; 

    constructor(
        id: string, x: number, y: number, width: number, height: number, speed: number, visualId: string,
        public maxHp: number,
        public hp: number = maxHp,
        public archetype: Archetype
    ) {
        super(id, x, y, width, height, speed, visualId);
    }

    public updateEntity(deltaTime: number): void {
        this.updatePosition(deltaTime);
        if (this.isInvulnerable) {
            this.invulnTimer -= deltaTime;
            if (this.invulnTimer <= 0) this.isInvulnerable = false;
        }
    }

    public takeDamage(amount: number): boolean {
        if (this.isInvulnerable || this.hp <= 0) return false;
        
        this.hp = Math.max(0, this.hp - amount);
        this.isInvulnerable = true;
        this.invulnTimer = LivingEntity.INVULN_DURATION;
        
        return true;
    }

    public isDead(): boolean {
        return this.hp <= 0;
    }
}