

export class Obstacle {
    public id: string;
    public startGridX: number;
    public startGridY: number;
    public endGridX: number;
    public endGridY: number;
    public isDestructible: boolean;
    private isDestructed: boolean = false;

    constructor(
        id: string, 
        startX: number, 
        startY: number,
        endX: number, 
        endY: number, 
        isDestructible: boolean = false
    ) {
        this.id = id;
        this.startGridX = startX;
        this.startGridY = startY;
        this.endGridX = endX;
        this.endGridY = endY;
        this.isDestructible = isDestructible;
    }
    
    public destroy() {
        if (this.isDestructible) {
            this.isDestructed = true;
        }
    }

    public isDestroyed(): boolean {
        return this.isDestructed;
    }
}