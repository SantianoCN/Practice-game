import { z } from 'zod';

export const EntityStatsSchema = z.object({
    maxHp: z.number(),
    maxMana: z.number(),
    speed: z.number(),
    sprite: z.string(),
    archetype: z.string()
});

export const ProjectileConfigSchema = z.object({
    damage: z.number(),
    range: z.number(),
    speed: z.number(),
    sprite: z.string()
});

export const WeaponConfigSchema = z.object({
    cooldownMs: z.number(),
    projectile: ProjectileConfigSchema,
    sprite: z.string()
});

export const StartingWeaponPresetSchema = z.object({
    key: z.string(),
    name: z.string(),
    description: z.string(),
    config: WeaponConfigSchema
});

export const PlayerClassPresetSchema = z.object({
    key: z.string(),
    name: z.string(),
    description: z.string(),
    stats: EntityStatsSchema,
    startingWeapons: z.array(StartingWeaponPresetSchema)
});