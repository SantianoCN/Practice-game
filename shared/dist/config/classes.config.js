"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAYER_CLASSES = exports.MAGE_PRESET_LIZARD = exports.WARRIOR_PRESET_LIZARD = exports.MAGE_PRESET = exports.WARRIOR_PRESET = void 0;
const weapon_config_1 = require("./weapon.config");
exports.WARRIOR_PRESET = { maxHp: 150, maxMana: 20, manaRegen: 5, speed: 100, visualId: 'Warrior', width: 40, height: 40, archetype: 'warrior' };
exports.MAGE_PRESET = { maxHp: 800, maxMana: 150, manaRegen: 100, speed: 130, visualId: 'Mage', width: 40, height: 40, archetype: 'mage' };
exports.WARRIOR_PRESET_LIZARD = { maxHp: 10, maxMana: Infinity, manaRegen: Infinity, speed: 90, visualId: 'red_box', width: 40, height: 40, archetype: 'warrior' };
exports.MAGE_PRESET_LIZARD = { maxHp: 10, maxMana: Infinity, manaRegen: Infinity, speed: 110, visualId: 'orange_box', width: 40, height: 40, archetype: 'mage' };
exports.PLAYER_CLASSES = {
    warrior: {
        key: 'warrior',
        name: 'Рус-Богатырь (Воин)',
        description: 'Крепкий защитник Земли Русской. Обладает огромным запасом здоровья, но невысокой скоростью.',
        stats: exports.WARRIOR_PRESET,
        startingWeapons: [weapon_config_1.STARTING_SWORD, weapon_config_1.STARTING_AXE]
    },
    mage: {
        key: 'mage',
        name: 'Рус-Волхв (Маг)',
        description: 'Мудрый колдун, повелевающий силами стихий. Быстрый, имеет много маны, но слабое здоровье.',
        stats: exports.MAGE_PRESET,
        startingWeapons: [weapon_config_1.STARTING_STAFF, weapon_config_1.STARTING_ICE_STAFF]
    }
};
