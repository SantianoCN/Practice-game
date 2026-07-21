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
        public readonly presetId: string
    ) {
        super(id, x, y, width, height, 'chest_closed'); 
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
        public readonly presetId: string,
        public readonly onPickup: GameEffect[]
    ) {
        super(id, x, y, DroppedItem.PICKUP_WIDTH, DroppedItem.PICKUP_HEIGHT, visualId);
    }
}