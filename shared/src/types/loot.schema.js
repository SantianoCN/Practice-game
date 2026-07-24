"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LootTableSchema = exports.LootTableEntrySchema = exports.ItemPresetSchema = exports.GameEffectSchema = exports.ItemTypeSchema = void 0;
const zod_1 = require("zod");
const weapon_schema_1 = require("./weapon.schema");
exports.ItemTypeSchema = zod_1.z.enum(['weapon', 'gold', 'consumable']);
exports.GameEffectSchema = zod_1.z.discriminatedUnion('type', [
    zod_1.z.object({
        type: zod_1.z.literal('heal'),
        value: zod_1.z.number()
    }),
    zod_1.z.object({
        type: zod_1.z.literal('add_gold'),
        value: zod_1.z.number()
    }),
    zod_1.z.object({
        type: zod_1.z.literal('equip_weapon'),
        weaponPresetId: zod_1.z.string()
    })
]);
const BasePresetSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    visualId: zod_1.z.string(),
    dropWidth: zod_1.z.number().optional(),
    dropHeight: zod_1.z.number().optional(),
    effects: zod_1.z.array(exports.GameEffectSchema).optional()
});
exports.ItemPresetSchema = zod_1.z.discriminatedUnion('type', [
    BasePresetSchema.extend({
        type: zod_1.z.literal('gold'),
        stats: zod_1.z.object({}).optional()
    }),
    BasePresetSchema.extend({
        type: zod_1.z.literal('consumable'),
        stats: zod_1.z.object({
            healAmount: zod_1.z.number()
        })
    }),
    BasePresetSchema.extend({
        type: zod_1.z.literal('weapon'),
        stats: weapon_schema_1.WeaponStatsSchema
    })
]);
exports.LootTableEntrySchema = zod_1.z.object({
    itemPresetId: zod_1.z.string(),
    weight: zod_1.z.number(),
    minQuantity: zod_1.z.number(),
    maxQuantity: zod_1.z.number()
});
exports.LootTableSchema = zod_1.z.object({
    id: zod_1.z.string(),
    rolls: zod_1.z.number(),
    entries: zod_1.z.array(exports.LootTableEntrySchema)
});
