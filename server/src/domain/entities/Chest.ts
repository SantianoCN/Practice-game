import { StaticEntity } from './BaseEntities';
import { Weapon } from './Weapon';

export type LootItem = 
    | { type: 'weapon', weapon: Weapon }
    | { type: 'gold', amount: number };

export class Chest extends StaticEntity {
    public isOpened: boolean = false;

    constructor(
        id: string,
        x: number,
        y: number,
        width: number,
        height: number,
        public gridX: number,
        public gridY: number,
        public loot: LootItem[]
    ) {
        super(id, x, y, width, height, 'chest');
    }
}

export class DroppedItem extends StaticEntity {
    constructor(
        id: string,
        x: number,
        y: number,
        width: number = 10,
        height: number = 10,
        visualId: string,
        public content: LootItem
    ) {
        super(id, x, y, width, height, visualId);
    }
}