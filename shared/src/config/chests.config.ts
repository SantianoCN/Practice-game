import { ChestPreset } from '../types/chest.schema';

export const CHESTS_DATABASE: Record<string, ChestPreset> = {
    chest_wooden: {
        id: 'chest_wooden',
        visualIdClosed: 'chest_wooden_closed',
        visualIdOpened: 'chest_wooden_opened',
        lootTableId: 'lt_normal_chest',
        width: 28,
        height: 28
    },
    chest_gold_boss: {
        id: 'chest_gold_boss',
        visualIdClosed: 'chest_gold_closed',
        visualIdOpened: 'chest_gold_opened',
        lootTableId: 'lt_boss_chest',
        width: 36,
        height: 36
    }
};