import { ItemPreset } from '../types/loot.schema';
import { SWORD, AXE, STAFF, ICE_STAFF, BOW, LIGHTNING_STAFF, STAFF_OF_BOSS } from './weapon.config';

export const ITEMS_DATABASE: Record<string, ItemPreset> = {
    gold_coins: {
        id: 'gold_coins',
        type: 'gold',
        name: 'Золото',
        visualId: 'gold_pile',
        dropWidth: 24,
        dropHeight: 24,
        effects: [
            { type: 'add_gold', value: 1 }
        ]
    },
    wpn_iron_sword: {
        id: 'wpn_iron_sword',
        type: 'weapon',
        name: 'Стальной Меч',
        visualId: 'iron_sword',
        dropWidth: 16,
        dropHeight: 32,
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
        dropWidth: 16,
        dropHeight: 32,
        effects: [
            { type: 'equip_weapon', weaponPresetId: 'wpn_heavy_axe' }
        ],
        stats: AXE
    },
    wpn_fire_staff: {
        id: 'wpn_fire_staff',
        type: 'weapon',
        name: 'Огненный посох',
        visualId: 'fire_staff',
        dropWidth: 16,
        dropHeight: 32,
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
        dropWidth: 16,
        dropHeight: 32,
        effects: [
            { type: 'equip_weapon', weaponPresetId: 'wpn_ice_staff' }
        ],
        stats: ICE_STAFF
    },
    wpn_hunter_bow: {
        id: 'wpn_hunter_bow',
        type: 'weapon',
        name: 'Охотничий Лук',
        visualId: 'hunter_bow',
        dropWidth: 16,
        dropHeight: 32,
        effects: [
            { type: 'equip_weapon', weaponPresetId: 'wpn_hunter_bow' }
        ],
        stats: BOW
    },
    wpn_lightning_staff: {
        id: 'wpn_lightning_staff',
        type: 'weapon',
        name: 'Посох Перуна',
        visualId: 'lightning_staff',
        dropWidth: 16,
        dropHeight: 32,
        effects: [
            { type: 'equip_weapon', weaponPresetId: 'wpn_lightning_staff' }
        ],
        stats: LIGHTNING_STAFF
    },
    wpn_boss_staff: {
        id: 'wpn_boss_staff',
        type: 'weapon',
        name: 'Посох Императора',
        visualId: 'fire_staff',
        dropWidth: 16,
        dropHeight: 32,
        effects: [
            { type: 'equip_weapon', weaponPresetId: 'wpn_boss_staff' }
        ],
        stats: STAFF_OF_BOSS
    },
    pot_heal: {
        id: 'pot_heal',
        type: 'consumable',
        name: 'Зелье лечения',
        visualId: 'potion_red',
        dropWidth: 12,
        dropHeight: 24,
        effects: [
            { type: 'heal', value: 50 }
        ]
    },
    pot_rejuv: {
        id: 'pot_rejuv',
        type: 'consumable',
        name: 'Эликсир Омоложения',
        visualId: 'potion_green',
        dropWidth: 12,
        dropHeight: 24,
        effects: [
            { type: 'heal', value: 30 },
            { type: 'add_gold', value: 15 }
        ]
    },
    pot_mana: {
        id: 'pot_mana',
        type: 'consumable',
        name: 'Вода Байкальская',
        visualId: 'potion_blue',
        dropWidth: 12,
        dropHeight: 24,
        effects: [
            { type: 'mana', value: 30 }
        ]
    },
    pot_speed: {
        id: 'pot_speed',
        type: 'consumable',
        name: 'Зелье Скорохода',
        visualId: 'potion_yellow',
        dropWidth: 12,
        dropHeight: 24,
        effects: [
            {
                type: 'apply_effect',
                effectId: 'speed_boost',
                name: 'Ускорение',
                duration: 10,
                modifiers: {
                    speedBonus: 60
                }
            }
        ]
    }
};