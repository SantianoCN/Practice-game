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
    public type: EntityType;
    public angle: number = 0;

    public hp: number = 100;
    public maxHp: number = 100;
    public mana: number = 100;
    public maxMana: number = 100;
    public gold: number = 0;
    public activeWeaponVisualId: string = '';
    public inventory: any[] = [];
    public currentWeaponIndex: number = 0;
    public maxInventoryLength: number = 3;

    public lastFacing: 'left' | 'Top' | 'right' = 'right';
    public currentAnimation: 'move' | 'attack' | 'die' | 'idle' = 'idle';
    public currentFrame: number = 0;

    private frameTimer: number = 0;
    private readonly timePerFrame: number = 0.2;

    constructor(
        id: string, 
        x: number, 
        y: number, 
        w: number, 
        h: number, 
        maxInventoryLength: number,
        visualId: string, 
        type: EntityType
    ) {
        this.id = id;
        this.targetX = x;
        this.targetY = y;
        this.renderX = x;
        this.renderY = y;
        this.width = w;
        this.height = h;
        this.maxInventoryLength = maxInventoryLength;
        this.visualId = visualId;
        this.type = type;
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