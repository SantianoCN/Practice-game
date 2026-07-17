import { Weapon } from "./Weapon";

export type LootItem = 
    | { type: 'weapon', weapon: Weapon }
    | { type: 'gold', amount: number };

export class DroppedItem {
    constructor(
        public id: string,
        public x: number,
        public y: number,
        public width: number = 10,
        public height: number = 10,
        public visualId: string,
        public content: LootItem
    ) {}
}

export class Chest {
    public isOpened: boolean = false;
    public readonly visualId: string = 'chest';

    constructor(
        public id: string,
        public x: number,
        public y: number,
        public width: number,
        public height: number,
        public gridX: number,
        public gridY: number,
        public loot: LootItem[]
    ) {}
}