export default class MoveableEntity {
    public id: string;
    public type: 'player' | 'enemy' | 'projectile';
    public x: number;
    public y: number;
    public vx: number;
    public vy: number;
    public speed: number;
    public width: number;
    public height: number;
    public sprite: string;
    public currentRoomX: number = 5;
    public currentRoomY: number = 5;

    constructor(id: string, type: 'player' | 'enemy' | 'projectile', x: number, y: number, width: number, height: number) {
        this.id = id;
        this.type = type;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.speed = 100;
        this.width = width;
        this.height = height;
        this.sprite = 'default_box';
    }

    public updatePosition(deltaTime: number): void {
        const movementLength = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        
        if (movementLength > 0) {
            this.x += (this.vx / movementLength) * this.speed * deltaTime;
            this.y += (this.vy / movementLength) * this.speed * deltaTime;
        }
    }

    public getBounds() {
        return {
            left: this.x - this.width / 2,
            right: this.x + this.width / 2,
            top: this.y - this.height / 2,
            bottom: this.y + this.height / 2
        };
    }
}