import { z } from 'zod';
import { EntityStatsSchema } from './stats.schema';
import { StartingWeaponStatsSchema } from './weapon.schema';

export const PlayerClassPresetSchema = z.object({
    key: z.string(),
    name: z.string(),
    description: z.string(),
    stats: EntityStatsSchema,
    startingWeapons: z.array(StartingWeaponStatsSchema)
});

export type PlayerClassPreset = z.infer<typeof PlayerClassPresetSchema>;
export type PlayerClassPresetDTO = PlayerClassPreset;