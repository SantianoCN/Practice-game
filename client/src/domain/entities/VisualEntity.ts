import { EntityType } from '@game/shared';

export class VisualEntity {
    public targetX: number;
    public targetY: number;
    public renderX: number;
    public renderY: number;
    public angle: number = 0;

    public hp: number = 100;
    public maxHp: number = 100;
    public mana: number = 100;
    public maxMana: number = 100;
    public gold: number = 0;
    public activeWeaponVisualId: string = '';
    public inventory: any[] = [];
    public currentWeaponIndex: number = 0;

    public lastFacing: 'left' | 'Top' | 'right' = 'right';
    public currentAnimation: 'move' | 'attack' | 'die' | 'idle' = 'idle';
    public currentFrame: number = 0;
    public canInteracting: boolean = false;

    private frameTimer: number = 0;
    private readonly timePerFrame: number = 0.2;

    constructor(
        public id: string,
        public name: string | null = null,
        x: number, 
        y: number, 
        public width: number, 
        public height: number, 
        public maxInventoryLength: number = 2,
        public visualId: string, 
        public type: EntityType
    ) {
        this.targetX = x;
        this.targetY = y;
        this.renderX = x;
        this.renderY = y;
    }

    public updateInterpolation(dt: number, lerpSpeed: number = 22): void {
        const lerpFactor = 1 - Math.exp(-lerpSpeed * dt);
        this.renderX += (this.targetX - this.renderX) * lerpFactor;
        this.renderY += (this.targetY - this.renderY) * lerpFactor;

        this.updateAnimation(dt);
    }

    private updateAnimation(dt: number): void {
        if (this.currentAnimation === 'idle' || this.currentAnimation === 'die') {
            this.currentFrame = 0;
            this.frameTimer = 0;
            return;
        }

        this.frameTimer += dt;
        if (this.frameTimer >= this.timePerFrame) {
            this.frameTimer = 0;
            this.currentFrame = (this.currentFrame + 1) % 3;
        }
    }
}