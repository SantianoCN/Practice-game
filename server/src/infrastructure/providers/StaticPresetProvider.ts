import { IPresetProvider } from '../../application/interfaces/IPresetProvider';
import { 
    CHESTS_DATABASE, LOOT_TABLES_DATABASE, ITEMS_DATABASE,
    ChestPreset, LootTable, ItemPreset 
} from '@game/shared';

export class StaticPresetProvider implements IPresetProvider {
    public getChestPreset(id: string): ChestPreset | null {
        return CHESTS_DATABASE[id] || null;
    }

    public getLootTable(id: string): LootTable | null {
        return LOOT_TABLES_DATABASE[id] || null;
    }

    public getItemPreset(id: string): ItemPreset | null {
        return ITEMS_DATABASE[id] || null;
    }
}