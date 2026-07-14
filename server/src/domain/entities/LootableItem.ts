import { WeaponConfig } from "../../../../shared/gameTypes";

export type LootableItem = 
    | { type: 'weapon', weapon: WeaponConfig }
    | { type: 'gold', gold: number }
    | { type: 'mana', mana: number } 