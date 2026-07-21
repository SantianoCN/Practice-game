import { z } from 'zod';
import { WeaponStatsSchema } from './weapon.schema';

export const ItemTypeSchema = z.enum(['weapon', 'gold', 'consumable']);
export type ItemType = z.infer<typeof ItemTypeSchema>;

export const GameEffectSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('heal'),
        value: z.number()
    }),
    z.object({
        type: z.literal('add_gold'),
        value: z.number()
    }),
    z.object({
        type: z.literal('equip_weapon'),
        weaponPresetId: z.string()
    })
]);
export type GameEffect = z.infer<typeof GameEffectSchema>;

const BasePresetSchema = z.object({
    id: z.string(),
    name: z.string(),
    visualId: z.string(),
    dropWidth: z.number().optional(),
    dropHeight: z.number().optional(),
    effects: z.array(GameEffectSchema).optional()
});

export const ItemPresetSchema = z.discriminatedUnion('type', [
    BasePresetSchema.extend({
        type: z.literal('gold'),
        stats: z.object({}).optional()
    }),
    BasePresetSchema.extend({
        type: z.literal('consumable'),
        stats: z.object({
            healAmount: z.number()
        })
    }),
    BasePresetSchema.extend({
        type: z.literal('weapon'),
        stats: WeaponStatsSchema
    })
]);
export type ItemPreset = z.infer<typeof ItemPresetSchema>;

export const LootTableEntrySchema = z.object({
    itemPresetId: z.string(),
    weight: z.number(),       
    minQuantity: z.number(),  
    maxQuantity: z.number()
});
export type LootTableEntry = z.infer<typeof LootTableEntrySchema>;

export const LootTableSchema = z.object({
    id: z.string(),
    rolls: z.number(),        
    entries: z.array(LootTableEntrySchema)
});
export type LootTable = z.infer<typeof LootTableSchema>;