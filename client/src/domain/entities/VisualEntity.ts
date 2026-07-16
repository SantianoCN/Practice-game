export class VisualEntity {
    public id: string;
    public targetX: number;
    public targetY: number;
    public renderX: number;
    public renderY: number;
    public width: number;
    public height: number;
    public sprite: string;
    
    public hp: number = 100;
    public maxHp: number = 100;
    public mana: number = 100;
    public maxMana: number = 100;

    public isDying: boolean = false;
    public lastFacing: 'left' | 'right' = 'right';
    public type: 'player' | 'enemy' | 'bullet' = 'player';

    constructor(id: string, x: number, y: number, w: number, h: number, sprite: string, type: 'player' | 'enemy' | 'bullet') {
        this.id = id;
        this.targetX = x;
        this.targetY = y;
        this.renderX = x;
        this.renderY = y;
        this.width = w;
        this.height = h;
        this.sprite = sprite;
        this.type = type;
    }

    public updateInterpolation(dt: number, lerpSpeed: number = 12): void {
        if (!this.isDying) {
            const t = 1 - Math.exp(-lerpSpeed * dt);
            this.renderX += (this.targetX - this.renderX) * t;
            this.renderY += (this.targetY - this.renderY) * t;
        } else if (this.type === 'bullet') {
            const dx = this.targetX - this.renderX;
            const dy = this.targetY - this.renderY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const dirX = dx / distance;
                const dirY = dy / distance;
                const step = 600 * dt;
                if (step >= distance) {
                    this.renderX = this.targetX;
                    this.renderY = this.targetY;
                } else {
                    this.renderX += dirX * step;
                    this.renderY += dirY * step;
                }
            }
        }
    }

    public hasReachedTarget(epsilon: number = 2): boolean {
        const dx = Math.abs(this.targetX - this.renderX);
        const dy = Math.abs(this.targetY - this.renderY);
        return dx < epsilon && dy < epsilon;
    }
}