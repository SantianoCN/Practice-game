import { z } from 'zod';

export const ChestPresetSchema = z.object({
    id: z.string(),
    visualIdClosed: z.string(),
    visualIdOpened: z.string(),
    lootTableId: z.string(),
    width: z.number(),
    height: z.number()
});
export type ChestPreset = z.infer<typeof ChestPresetSchema>;