import { LootTable, ItemPreset, GameEffect } from '@game/shared';

export interface RolledLootResult {
    presetId: string;
    visualId: string;
    onPickup: GameEffect[];
}

export class LootService {
    public static rollLoot(
        lootTable: LootTable, 
        getItemPreset: (id: string) => ItemPreset | null
    ): RolledLootResult[] {
        const results: RolledLootResult[] = [];

        for (let r = 0; r < lootTable.rolls; r++) {
            const chosenEntry = this.rollSingleEntry(lootTable);
            if (!chosenEntry) continue;

            const preset = getItemPreset(chosenEntry.itemPresetId);
            if (!preset) continue;

            const quantity = Math.floor(
                Math.random() * (chosenEntry.maxQuantity - chosenEntry.minQuantity + 1)
            ) + chosenEntry.minQuantity;

            const templateEffects = preset.effects || [];

            const onPickup: GameEffect[] = templateEffects.map(effect => {
                if ('value' in effect && typeof effect.value === 'number') {
                    return {
                        ...effect,
                        value: effect.value * quantity
                    } as GameEffect;
                }
                return effect;
            });

            results.push({
                presetId: preset.id,
                visualId: preset.visualId,
                onPickup
            });
        }

        return results;
    }

    private static rollSingleEntry(lootTable: LootTable) {
        const totalWeight = lootTable.entries.reduce((sum, entry) => sum + entry.weight, 0);
        if (totalWeight <= 0) return null;

        let roll = Math.random() * totalWeight;
        for (const entry of lootTable.entries) {
            roll -= entry.weight;
            if (roll <= 0) {
                return entry;
            }
        }

        return lootTable.entries[lootTable.entries.length - 1];
    }
}