import { StaticEntity } from './BaseEntities';

export class Obstacle extends StaticEntity {
    constructor(id: string, x: number, y: number, width: number, height: number, visualId: string = 'black') {
        super(id, x, y, width, height, visualId);
    }
}