import { LootTable } from '../types/loot.schema';

export const LOOT_TABLES_DATABASE: Record<string, LootTable> = {
    lt_normal_chest: {
        id: 'lt_normal_chest',
        rolls: 2, 
        entries: [
            { itemPresetId: 'gold_coins', weight: 100, minQuantity: 10, maxQuantity: 30 },
            { itemPresetId: 'pot_heal', weight: 30, minQuantity: 1, maxQuantity: 1 },
            { itemPresetId: 'pot_speed', weight: 20, minQuantity: 1, maxQuantity: 1 },
            { itemPresetId: 'wpn_iron_sword', weight: 10, minQuantity: 1, maxQuantity: 1 }
        ]
    },
    lt_gold_chest: {
        id: 'lt_gold_chest',
        rolls: 1, 
        entries: [
            { itemPresetId: 'gold_coins', weight: 100, minQuantity: 50, maxQuantity: 100 }
        ]
    },
    lt_weapon_chest: {
        id: 'lt_weapon_chest',
        rolls: 1, 
        entries: [
            { itemPresetId: 'wpn_fire_staff', weight: 10, minQuantity: 1, maxQuantity: 1 },
            { itemPresetId: 'wpn_heavy_axe', weight: 10, minQuantity: 1, maxQuantity: 1 },
            { itemPresetId: 'wpn_iron_sword', weight: 10, minQuantity: 1, maxQuantity: 1 },
            { itemPresetId: 'wpn_ice_staff', weight: 10, minQuantity: 1, maxQuantity: 1 },
            { itemPresetId: 'wpn_hunter_bow', weight: 10, minQuantity: 1, maxQuantity: 1 },
            { itemPresetId: 'wpn_lightning_staff', weight: 5, minQuantity: 1, maxQuantity: 1 }
        ]
    },
    lt_potion_chest: {
        id: 'lt_potion_chest',
        rolls: 2, 
        entries: [
            { itemPresetId: 'pot_heal', weight: 30, minQuantity: 1, maxQuantity: 2 },
            { itemPresetId: 'pot_rejuv', weight: 15, minQuantity: 1, maxQuantity: 1 },
            { itemPresetId: 'pot_mana', weight: 30, minQuantity: 1, maxQuantity: 1 },
            { itemPresetId: 'pot_speed', weight: 25, minQuantity: 1, maxQuantity: 2 }
        ]
    },
    lt_boss_chest: {
        id: 'lt_boss_chest',
        rolls: 3,
        entries: [
            { itemPresetId: 'gold_coins', weight: 100, minQuantity: 50, maxQuantity: 150 },
            { itemPresetId: 'wpn_fire_staff', weight: 30, minQuantity: 1, maxQuantity: 1 },
            { itemPresetId: 'wpn_lightning_staff', weight: 20, minQuantity: 1, maxQuantity: 1 },
            { itemPresetId: 'wpn_boss_staff', weight: 10, minQuantity: 1, maxQuantity: 1 },
            { itemPresetId: 'wpn_iron_sword', weight: 50, minQuantity: 1, maxQuantity: 1 },
            { itemPresetId: 'pot_heal', weight: 80, minQuantity: 1, maxQuantity: 2 }
        ]
    },
    lt_rare_melee_chest: {
        id: 'lt_rare_melee_chest',
        rolls: 1,
        entries: [
            { itemPresetId: 'wpn_thunder_spear', weight: 50, minQuantity: 1, maxQuantity: 1 },
            { itemPresetId: 'wpn_holy_greatsword', weight: 50, minQuantity: 1, maxQuantity: 1 },
            { itemPresetId: 'gold_coins', weight: 20, minQuantity: 50, maxQuantity: 100 }
        ]
    },
    lt_rare_ranged_chest: {
        id: 'lt_rare_ranged_chest',
        rolls: 1,
        entries: [
            { itemPresetId: 'wpn_dragon_bow', weight: 50, minQuantity: 1, maxQuantity: 1 },
            { itemPresetId: 'wpn_baikal_staff', weight: 50, minQuantity: 1, maxQuantity: 1 },
            { itemPresetId: 'gold_coins', weight: 20, minQuantity: 50, maxQuantity: 100 }
        ]
    }
};