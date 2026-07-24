import { z } from 'zod';
export declare const ProjectileStatsSchema: z.ZodObject<{
    radius: z.ZodNumber;
    damage: z.ZodNumber;
    range: z.ZodNumber;
    speed: z.ZodNumber;
    visualId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    speed: number;
    visualId: string;
    radius: number;
    damage: number;
    range: number;
}, {
    speed: number;
    visualId: string;
    radius: number;
    damage: number;
    range: number;
}>;
export type ProjectileStats = z.infer<typeof ProjectileStatsSchema>;
export declare const WeaponStatsSchema: z.ZodObject<{
    cooldownMs: z.ZodNumber;
    manaCost: z.ZodNumber;
    projectile: z.ZodObject<{
        radius: z.ZodNumber;
        damage: z.ZodNumber;
        range: z.ZodNumber;
        speed: z.ZodNumber;
        visualId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        speed: number;
        visualId: string;
        radius: number;
        damage: number;
        range: number;
    }, {
        speed: number;
        visualId: string;
        radius: number;
        damage: number;
        range: number;
    }>;
    visualId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    visualId: string;
    cooldownMs: number;
    manaCost: number;
    projectile: {
        speed: number;
        visualId: string;
        radius: number;
        damage: number;
        range: number;
    };
}, {
    visualId: string;
    cooldownMs: number;
    manaCost: number;
    projectile: {
        speed: number;
        visualId: string;
        radius: number;
        damage: number;
        range: number;
    };
}>;
export type WeaponStats = z.infer<typeof WeaponStatsSchema>;
export declare const StartingWeaponStatsSchema: z.ZodObject<{
    key: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    config: z.ZodObject<{
        cooldownMs: z.ZodNumber;
        manaCost: z.ZodNumber;
        projectile: z.ZodObject<{
            radius: z.ZodNumber;
            damage: z.ZodNumber;
            range: z.ZodNumber;
            speed: z.ZodNumber;
            visualId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            speed: number;
            visualId: string;
            radius: number;
            damage: number;
            range: number;
        }, {
            speed: number;
            visualId: string;
            radius: number;
            damage: number;
            range: number;
        }>;
        visualId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        visualId: string;
        cooldownMs: number;
        manaCost: number;
        projectile: {
            speed: number;
            visualId: string;
            radius: number;
            damage: number;
            range: number;
        };
    }, {
        visualId: string;
        cooldownMs: number;
        manaCost: number;
        projectile: {
            speed: number;
            visualId: string;
            radius: number;
            damage: number;
            range: number;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    key: string;
    name: string;
    description: string;
    config: {
        visualId: string;
        cooldownMs: number;
        manaCost: number;
        projectile: {
            speed: number;
            visualId: string;
            radius: number;
            damage: number;
            range: number;
        };
    };
}, {
    key: string;
    name: string;
    description: string;
    config: {
        visualId: string;
        cooldownMs: number;
        manaCost: number;
        projectile: {
            speed: number;
            visualId: string;
            radius: number;
            damage: number;
            range: number;
        };
    };
}>;
export type StartingWeaponStats = z.infer<typeof StartingWeaponStatsSchema>;
