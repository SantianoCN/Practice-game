import Weapon from "../items/Weapon";
import { LootableItem } from "./LootableItem";


export class Chest {
    public id: string;
    public gridX: number;
    public gridY: number;
    public loot: LootableItem[];
    public isOpened: boolean;

     constructor(
        id: string,
        x: number,
        y: number,
        loot: LootableItem[],
        isOpened: boolean = false
    ) {
        this.id = id;
        this.gridX = x;
        this.gridY = y;
        this.loot = loot,
        this.isOpened = false
    }
}