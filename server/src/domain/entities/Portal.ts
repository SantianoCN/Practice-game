import { StaticEntity } from './BaseEntities';

export class Portal extends StaticEntity {
    public isActive: boolean = false;

    constructor(
        id: string,
        x: number,
        y: number,
        width: number,
        height: number,
        visualId: string = 'portal_closed'
    ) {
        super(id, x, y, width, height, visualId);
    }

    public activate(): void {
        this.isActive = true;
        this.visualId = 'portal_active';
    }
}