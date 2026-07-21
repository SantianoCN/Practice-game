import { LootTable } from '../types/loot.schema';

export const LOOT_TABLES_DATABASE: Record<string, LootTable> = {
    lt_normal_chest: {
        id: 'lt_normal_chest',
        rolls: 2, 
        entries: [
            { itemPresetId: 'gold_coins', weight: 100, minQuantity: 10, maxQuantity: 30 },
            { itemPresetId: 'pot_heal', weight: 30, minQuantity: 1, maxQuantity: 1 },
            { itemPresetId: 'wpn_iron_sword', weight: 10, minQuantity: 1, maxQuantity: 1 }
        ]
    },
    lt_boss_chest: {
        id: 'lt_boss_chest',
        rolls: 3,
        entries: [
            { itemPresetId: 'gold_coins', weight: 100, minQuantity: 50, maxQuantity: 150 },
            { itemPresetId: 'wpn_fire_staff', weight: 30, minQuantity: 1, maxQuantity: 1 },
            { itemPresetId: 'wpn_iron_sword', weight: 50, minQuantity: 1, maxQuantity: 1 },
            { itemPresetId: 'pot_heal', weight: 80, minQuantity: 1, maxQuantity: 2 }
        ]
    }
};