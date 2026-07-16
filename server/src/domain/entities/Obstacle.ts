import { BoundingBox } from './BaseEntities';

export class Obstacle {
    constructor(
        public id: string,
        public x: number,
        public y: number,
        public width: number,
        public height: number,
        public sprite: string = 'black'
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