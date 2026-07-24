"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityStatsSchema = exports.EntityTypeSchema = exports.ArchetypeSchema = void 0;
const zod_1 = require("zod");
exports.ArchetypeSchema = zod_1.z.enum(['warrior', 'mage']);
exports.EntityTypeSchema = zod_1.z.enum(['player', 'enemy', 'bullet', 'obstacle', 'item']);
exports.EntityStatsSchema = zod_1.z.object({
    maxHp: zod_1.z.number(),
    maxMana: zod_1.z.number(),
    manaRegen: zod_1.z.number(),
    speed: zod_1.z.number(),
    visualId: zod_1.z.string(),
    width: zod_1.z.number(),
    height: zod_1.z.number(),
    archetype: exports.ArchetypeSchema
});
