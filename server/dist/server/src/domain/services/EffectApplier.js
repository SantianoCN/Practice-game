"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EffectApplier = void 0;
const Weapon_1 = require("../entities/Weapon");
class EffectApplier {
    static apply(effect, player, getItemPreset, generateWeaponId) {
        switch (effect.type) {
            case 'heal':
                player.hp = Math.min(player.maxHp, player.hp + effect.value);
                break;
            case 'add_gold':
                player.addGold(effect.value);
                break;
            case 'equip_weapon': {
                const preset = getItemPreset(effect.weaponPresetId);
                if (!preset || preset.type !== 'weapon' || !preset.stats)
                    return;
                const newWeapon = new Weapon_1.Weapon(generateWeaponId(), preset.id, preset.name, preset.stats);
                const oldWeapon = player.addWeaponToInventory(newWeapon);
                if (oldWeapon) {
                    return { droppedWeapon: oldWeapon };
                }
                break;
            }
        }
    }
}
exports.EffectApplier = EffectApplier;
