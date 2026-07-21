import { ChestPreset, LootTable, ItemPreset } from '@game/shared';

export interface IPresetProvider {
    getChestPreset(id: string): ChestPreset | null;
    getLootTable(id: string): LootTable | null;
    getItemPreset(id: string): ItemPreset | null;
}