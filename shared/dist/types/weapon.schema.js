"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartingWeaponStatsSchema = exports.WeaponStatsSchema = exports.ProjectileStatsSchema = void 0;
const zod_1 = require("zod");
exports.ProjectileStatsSchema = zod_1.z.object({
    radius: zod_1.z.number(),
    damage: zod_1.z.number(),
    range: zod_1.z.number(),
    speed: zod_1.z.number(),
    visualId: zod_1.z.string()
});
exports.WeaponStatsSchema = zod_1.z.object({
    cooldownMs: zod_1.z.number(),
    manaCost: zod_1.z.number(),
    projectile: exports.ProjectileStatsSchema,
    visualId: zod_1.z.string()
});
exports.StartingWeaponStatsSchema = zod_1.z.object({
    key: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    config: exports.WeaponStatsSchema
});
