import { EntityStats } from '../types/stats.schema';
import { PlayerClassPreset } from '../types/preset.schema';
import { STARTING_SWORD, STARTING_AXE, STARTING_STAFF, STARTING_ICE_STAFF } from './weapon.config'

export const WARRIOR_PRESET: EntityStats = { maxHp: 150, maxMana: 20, manaRegen: 5, speed: 100, visualId: 'Warrior', width: 40, height: 40, maxInventoryLength: 2, archetype: 'warrior' };
export const MAGE_PRESET: EntityStats = { maxHp: 80, maxMana: 150, manaRegen: 100, speed: 130, visualId: 'Mage', width: 40, height: 40, maxInventoryLength: 2, archetype: 'mage' };

export const WARRIOR_PRESET_LIZARD: EntityStats = { maxHp: 10, maxMana: Infinity, manaRegen: Infinity, speed: 10, visualId: 'red_box', width: 40, height: 40, maxInventoryLength: 1, archetype: 'warrior' };
export const MAGE_PRESET_LIZARD: EntityStats = { maxHp: 10, maxMana: Infinity, manaRegen: Infinity, speed: 10, visualId: 'orange_box', width: 40, height: 40, maxInventoryLength: 1, archetype: 'mage' };

export const PLAYER_CLASSES: Record<string, PlayerClassPreset> = {
    warrior: {
        key: 'warrior',
        name: 'Рус-Богатырь (Воин)',
        description: 'Крепкий защитник Земли Русской. Обладает огромным запасом здоровья, но невысокой скоростью.',
        stats: WARRIOR_PRESET,
        startingWeapons: [STARTING_SWORD, STARTING_AXE]
    },
    mage: {
        key: 'mage',
        name: 'Рус-Волхв (Маг)',
        description: 'Мудрый колдун, повелевающий силами стихий. Быстрый, имеет много маны, но слабое здоровье.',
        stats: MAGE_PRESET,
        startingWeapons: [STARTING_STAFF, STARTING_ICE_STAFF]
    }
};