import { GameEffect } from '@game/shared';
import { StaticEntity } from './BaseEntities';

export class Chest extends StaticEntity {
    public isOpened: boolean = false;

    constructor(
        id: string,
        x: number,
        y: number,
        width: number,
        height: number,
        public readonly gridX: number,
        public readonly gridY: number,
        public readonly presetId: string,
        visualIdClosed: string = 'chest_closed'
    ) {
        super(id, x, y, width, height, visualIdClosed); 
    }

    public open(visualIdOpened: string): void {
        if (this.isOpened) return;
        this.isOpened = true;
        this.visualId = visualIdOpened;
    }
}

export class DroppedItem extends StaticEntity {
    public static readonly PICKUP_WIDTH = 24;
    public static readonly PICKUP_HEIGHT = 24;

    constructor(
        id: string,
        x: number,
        y: number,
        visualId: string,
        width: number | undefined,
        height: number | undefined,
        public readonly presetId: string,
        public readonly onPickup: GameEffect[]
    ) {
        const visualWidth = width ? width : DroppedItem.PICKUP_WIDTH;
        const visualHeight= height ? height : DroppedItem.PICKUP_HEIGHT;
        super(id, x, y, visualWidth, visualHeight, visualId);
    }
}