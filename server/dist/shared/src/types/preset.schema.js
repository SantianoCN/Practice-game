"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerClassPresetSchema = void 0;
const zod_1 = require("zod");
const stats_schema_1 = require("./stats.schema");
const weapon_schema_1 = require("./weapon.schema");
exports.PlayerClassPresetSchema = zod_1.z.object({
    key: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    stats: stats_schema_1.EntityStatsSchema,
    startingWeapons: zod_1.z.array(weapon_schema_1.StartingWeaponStatsSchema)
});
