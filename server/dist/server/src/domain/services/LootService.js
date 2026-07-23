"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LootService = void 0;
class LootService {
    static rollLoot(lootTable, getItemPreset) {
        const results = [];
        for (let r = 0; r < lootTable.rolls; r++) {
            const chosenEntry = this.rollSingleEntry(lootTable);
            if (!chosenEntry)
                continue;
            const preset = getItemPreset(chosenEntry.itemPresetId);
            if (!preset)
                continue;
            const quantity = Math.floor(Math.random() * (chosenEntry.maxQuantity - chosenEntry.minQuantity + 1)) + chosenEntry.minQuantity;
            const templateEffects = preset.effects || [];
            const onPickup = templateEffects.map(effect => {
                if ('value' in effect && typeof effect.value === 'number') {
                    return {
                        ...effect,
                        value: effect.value * quantity
                    };
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
    static rollSingleEntry(lootTable) {
        const totalWeight = lootTable.entries.reduce((sum, entry) => sum + entry.weight, 0);
        if (totalWeight <= 0)
            return null;
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
exports.LootService = LootService;
