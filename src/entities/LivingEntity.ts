import MoveableEntity from './MoveableEntity.js';

export default class LivingEntity extends MoveableEntity {
    private static readonly INVULN_DURATION = 500;

    public archetype: string;
    public hp: number;
    public maxHp: number;
    public mana: number;
    public maxMana: number;
    
    public isInvulnerable: boolean;
    protected invulnTimer: number;

    constructor(id: string, type: 'player' | 'enemy', x: number, y: number, width: number, height: number, archetype: string) {
        super(id, type, x, y, width, height);
        this.archetype = archetype;
        this.hp = 100;
        this.maxHp = 100;
        this.mana = 0;
        this.maxMana = 0;
        
        this.isInvulnerable = false;
        this.invulnTimer = 0;
    }

    public updateEntity(deltaTime: number): void {
        this.updatePosition(deltaTime);

        if (this.isInvulnerable) {
            this.invulnTimer -= deltaTime;
            if (this.invulnTimer <= 0) {
                this.isInvulnerable = false;
            }
        }
    }

    public takeDamage(amount: number): boolean {
        if (this.isInvulnerable || this.hp <= 0) return false;

        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;

        this.isInvulnerable = true;
        this.invulnTimer = LivingEntity.INVULN_DURATION;

        if (this.hp === 0) {
            this.die();
        }
        return true;
    }

    public die(): void {
    }
}