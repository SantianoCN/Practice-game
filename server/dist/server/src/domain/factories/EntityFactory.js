"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityFactory = void 0;
const Player_1 = require("../entities/Player");
const Weapon_1 = require("../entities/Weapon");
const Enemy_1 = require("../entities/Enemy");
const shared_1 = require("@game/shared");
class EntityFactory {
    static createPlayer(userId, login, archetype, weaponId, startX, startY, generateId) {
        const classPreset = shared_1.PLAYER_CLASSES[archetype] || shared_1.PLAYER_CLASSES['warrior'];
        const stats = classPreset.stats;
        let weaponPreset = classPreset.startingWeapons.find(w => w.key === weaponId);
        if (!weaponPreset) {
            weaponPreset = classPreset.startingWeapons[0];
        }
        const weapon = new Weapon_1.Weapon(generateId('wpn'), weaponPreset.key, weaponPreset.name, weaponPreset.config);
        const player = new Player_1.Player(userId, login, startX, startY, stats, weapon, stats.maxMana, stats.maxMana, stats.manaRegen);
        return player;
    }
    static createEnemy(x, y, stats, weaponConfig, generateId) {
        const weapon = new Weapon_1.Weapon(generateId('wpn'), weaponConfig.visualId, 'Вражеское Оружие', weaponConfig);
        return new Enemy_1.Enemy(generateId('enm'), x, y, stats, weapon);
    }
}
exports.EntityFactory = EntityFactory;
