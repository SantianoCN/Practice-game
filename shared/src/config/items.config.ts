import { ItemPreset } from '../types/loot.schema';
import { SWORD, AXE, STAFF, ICE_STAFF } from './weapon.config';

export const ITEMS_DATABASE: Record<string, ItemPreset> = {
    gold_coins: {
        id: 'gold_coins',
        type: 'gold',
        name: 'Золото',
        visualId: 'gold_pile',
        effects: [
            { type: 'add_gold', value: 1 }
        ],
        stats: {}
    },
    wpn_iron_sword: {
        id: 'wpn_iron_sword',
        type: 'weapon',
        name: 'Стальной Меч',
        visualId: 'iron_sword',
        effects: [
            { type: 'equip_weapon', weaponPresetId: 'wpn_iron_sword' }
        ],
        stats: SWORD
    },
    wpn_heavy_axe: {
        id: 'wpn_heavy_axe',
        type: 'weapon',
        name: 'Секира Перуна',
        visualId: 'battle_axe',
        effects: [
            { type: 'equip_weapon', weaponPresetId: 'wpn_heavy_axe' }
        ],
        stats: AXE
    },
    wpn_fire_staff: {
        id: 'wpn_fire_staff',
        type: 'weapon',
        name: 'Огненный посох',
        visualId: 'staff',
        effects: [
            { type: 'equip_weapon', weaponPresetId: 'wpn_fire_staff' }
        ],
        stats: STAFF
    },
    wpn_ice_staff: {
        id: 'wpn_ice_staff',
        type: 'weapon',
        name: 'Ледяной посох',
        visualId: 'ice_staff',
        effects: [
            { type: 'equip_weapon', weaponPresetId: 'wpn_ice_staff' }
        ],
        stats: ICE_STAFF
    },
    pot_heal: {
        id: 'pot_heal',
        type: 'consumable',
        name: 'Зелье лечения',
        visualId: 'potion_red',
        effects: [
            { type: 'heal', value: 50 }
        ],
        stats: { healAmount: 50 }
    },
    pot_rejuv: {
        id: 'pot_rejuv',
        type: 'consumable',
        name: 'Эликсир Омоложения',
        visualId: 'potion_purple',
        effects: [
            { type: 'heal', value: 30 },
            { type: 'add_gold', value: 15 }
        ],
        stats: { healAmount: 30 }
    }
};