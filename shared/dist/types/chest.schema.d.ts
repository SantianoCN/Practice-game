import { z } from 'zod';
export declare const ChestPresetSchema: z.ZodObject<{
    id: z.ZodString;
    visualIdClosed: z.ZodString;
    visualIdOpened: z.ZodString;
    lootTableId: z.ZodString;
    width: z.ZodNumber;
    height: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    width: number;
    height: number;
    id: string;
    visualIdClosed: string;
    visualIdOpened: string;
    lootTableId: string;
}, {
    width: number;
    height: number;
    id: string;
    visualIdClosed: string;
    visualIdOpened: string;
    lootTableId: string;
}>;
export type ChestPreset = z.infer<typeof ChestPresetSchema>;
