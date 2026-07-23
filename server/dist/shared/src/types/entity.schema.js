"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObstacleStateSchema = exports.DroppedItemStateSchema = exports.ChestStateSchema = exports.BulletStateSchema = exports.EnemyStateSchema = exports.PlayerStateSchema = exports.BaseEntityStateSchema = void 0;
const zod_1 = require("zod");
const loot_schema_1 = require("./loot.schema");
exports.BaseEntityStateSchema = zod_1.z.object({
    id: zod_1.z.string(),
    x: zod_1.z.number(),
    y: zod_1.z.number(),
    width: zod_1.z.number(),
    height: zod_1.z.number(),
    visualId: zod_1.z.string()
});
exports.PlayerStateSchema = exports.BaseEntityStateSchema.extend({
    hp: zod_1.z.number(),
    maxHp: zod_1.z.number(),
    mana: zod_1.z.number(),
    maxMana: zod_1.z.number(),
    gold: zod_1.z.number(),
    activeWeaponVisualId: zod_1.z.string()
});
exports.EnemyStateSchema = exports.BaseEntityStateSchema.extend({
    hp: zod_1.z.number(),
    maxHp: zod_1.z.number()
});
exports.BulletStateSchema = exports.BaseEntityStateSchema.extend({
    speed: zod_1.z.number()
});
exports.ChestStateSchema = exports.BaseEntityStateSchema.extend({
    gridX: zod_1.z.number(),
    gridY: zod_1.z.number(),
    isOpened: zod_1.z.boolean(),
    presetId: zod_1.z.string()
});
exports.DroppedItemStateSchema = exports.BaseEntityStateSchema.extend({
    presetId: zod_1.z.string(),
    onPickup: zod_1.z.array(loot_schema_1.GameEffectSchema)
});
exports.ObstacleStateSchema = exports.BaseEntityStateSchema;
