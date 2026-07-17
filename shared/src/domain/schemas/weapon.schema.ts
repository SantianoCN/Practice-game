import { z } from 'zod';

export const ProjectileStatsSchema = z.object({
    damage: z.number(),
    range: z.number(),
    speed: z.number(),
    visualId: z.string()
});
export type ProjectileStats = z.infer<typeof ProjectileStatsSchema>;

export const WeaponStatsSchema = z.object({
    cooldownMs: z.number(),
    projectile: ProjectileStatsSchema,
    visualId: z.string()
});
export type WeaponStats = z.infer<typeof WeaponStatsSchema>;

export const StartingWeaponStatsSchema = z.object({
    key: z.string(),
    name: z.string(),
    description: z.string(),
    config: WeaponStatsSchema
});
export type StartingWeaponStats = z.infer<typeof StartingWeaponStatsSchema>;