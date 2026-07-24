"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerActionSchema = exports.SessionJoinRequestSchema = exports.SessionCreateRequestSchema = exports.BuyItemRequestSchema = exports.PlayerProgressSchema = exports.TokenRequestSchema = exports.LoginDataSchema = void 0;
const zod_1 = require("zod");
const stats_schema_1 = require("../types/stats.schema");
const command_schema_1 = require("../types/command.schema");
exports.LoginDataSchema = zod_1.z.object({
    login: zod_1.z.string().min(3).max(20),
    password: zod_1.z.string().min(4)
});
exports.TokenRequestSchema = zod_1.z.object({
    token: zod_1.z.string()
});
exports.PlayerProgressSchema = zod_1.z.object({
    metaGold: zod_1.z.number(),
    unlockedClasses: zod_1.z.array(zod_1.z.string()),
    unlockedWeapons: zod_1.z.array(zod_1.z.string())
});
exports.BuyItemRequestSchema = zod_1.z.object({
    itemPresetId: zod_1.z.string()
});
exports.SessionCreateRequestSchema = zod_1.z.object({
    token: zod_1.z.string(),
    archetype: stats_schema_1.ArchetypeSchema,
    weaponId: zod_1.z.string()
});
exports.SessionJoinRequestSchema = zod_1.z.object({
    sessionId: zod_1.z.string(),
    token: zod_1.z.string(),
    archetype: stats_schema_1.ArchetypeSchema,
    weaponId: zod_1.z.string()
});
exports.PlayerActionSchema = zod_1.z.object({
    keys: command_schema_1.PlayerCommandSchema
});
