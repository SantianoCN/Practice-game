import { EntityType } from '@game/shared';

export class VisualEntity {
    public id: string;
    public targetX: number;
    public targetY: number;
    public renderX: number;
    public renderY: number;
    public width: number;
    public height: number;
    public visualId: string;
    
    public hp: number = 100;
    public maxHp: number = 100;
    public mana: number = 100;
    public maxMana: number = 100;
    public gold: number = 0;
    public activeWeaponVisualId: string = '';

    public isDying: boolean = false;
    public lastFacing: 'left' | 'Top' | 'right' = 'right';
    public currentAnimation: 'move' | 'attack' | 'idle' = 'idle';
    public currentFrame: number = 0;
    public type: EntityType = 'player';

    private frameTimer: number = 0;
    private readonly timePerFrame: number = 0.2; // время на один кадр

    constructor(id: string, x: number, y: number, w: number, h: number, visualId: string, type: 'player' | 'enemy' | 'bullet') {
        this.id = id;
        this.targetX = x;
        this.targetY = y;
        this.renderX = x;
        this.renderY = y;
        this.width = w;
        this.height = h;
        this.visualId = visualId;
        this.type = type;
    }

    public updateInterpolation(dt: number, lerpSpeed: number = 12): void {
        if (!this.isDying) {
            const lerpFactor = 1 - Math.exp(-lerpSpeed * dt);
            this.renderX += (this.targetX - this.renderX) * lerpFactor;
            this.renderY += (this.targetY - this.renderY) * lerpFactor;
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

        this.updateAnimation(dt)
    }

    public hasReachedTarget(epsilon: number = 2): boolean {
        const dx = Math.abs(this.targetX - this.renderX);
        const dy = Math.abs(this.targetY - this.renderY);
        return dx < epsilon && dy < epsilon;
    }

    private updateAnimation(dt: number): void {
        // Пули или умирающие сущности обычно не анимируют по стандартному циклу
        if (this.isDying || this.type === 'bullet') return;

        // Если сущность стоит на месте (в состоянии idle), принудительно сбрасываем на 1-й кадр
        if (this.currentAnimation === 'idle') {
            this.currentFrame = 0;
            this.frameTimer = 0;
            return;
        }

        // Накапливаем прошедшее время
        this.frameTimer += dt;

        // Если накопилось достаточно времени для смены кадра
        if (this.frameTimer >= this.timePerFrame) {
            this.frameTimer = 0; // Сбрасываем таймер
            
            // У вас в спрайт-листе ровно 3 кадра, поэтому гоняем по кругу: 0, 1, 2
            this.currentFrame = (this.currentFrame + 1) % 3;
        }
    }
}
