import { Player } from '../entities/Player';
import { Weapon } from '../entities/Weapon';
import { GameEffect, ItemPreset } from '@game/shared';

export interface EffectApplyResult {
    droppedWeapon?: Weapon;
}

export class EffectApplier {
    public static apply(
        effect: GameEffect,
        player: Player,
        getItemPreset: (presetId: string) => ItemPreset | null,
        generateWeaponId: () => string
    ): EffectApplyResult | void {
        switch (effect.type) {
            case 'heal':
                player.hp = Math.min(player.maxHp, player.hp + effect.value);
                break;

            case 'add_gold':
                player.addGold(effect.value);
                break;

            case 'equip_weapon': {
                const preset = getItemPreset(effect.weaponPresetId);
                if (!preset || preset.type !== 'weapon' || !preset.stats) return;

                const newWeapon = new Weapon(
                    generateWeaponId(),
                    preset.id,
                    preset.name,
                    preset.stats
                );

                const oldWeapon = player.addWeaponToInventory(newWeapon);
                if (oldWeapon) {
                    return { droppedWeapon: oldWeapon };
                }
                break;
            }
        }
    }
}