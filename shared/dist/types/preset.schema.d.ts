import { z } from 'zod';
export declare const PlayerClassPresetSchema: z.ZodObject<{
    key: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    stats: z.ZodObject<{
        maxHp: z.ZodNumber;
        maxMana: z.ZodNumber;
        manaRegen: z.ZodNumber;
        speed: z.ZodNumber;
        visualId: z.ZodString;
        width: z.ZodNumber;
        height: z.ZodNumber;
        archetype: z.ZodEnum<["warrior", "mage"]>;
    }, "strip", z.ZodTypeAny, {
        maxHp: number;
        maxMana: number;
        manaRegen: number;
        speed: number;
        visualId: string;
        width: number;
        height: number;
        archetype: "warrior" | "mage";
    }, {
        maxHp: number;
        maxMana: number;
        manaRegen: number;
        speed: number;
        visualId: string;
        width: number;
        height: number;
        archetype: "warrior" | "mage";
    }>;
    startingWeapons: z.ZodArray<z.ZodObject<{
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
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    key: string;
    name: string;
    description: string;
    stats: {
        maxHp: number;
        maxMana: number;
        manaRegen: number;
        speed: number;
        visualId: string;
        width: number;
        height: number;
        archetype: "warrior" | "mage";
    };
    startingWeapons: {
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
    }[];
}, {
    key: string;
    name: string;
    description: string;
    stats: {
        maxHp: number;
        maxMana: number;
        manaRegen: number;
        speed: number;
        visualId: string;
        width: number;
        height: number;
        archetype: "warrior" | "mage";
    };
    startingWeapons: {
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
    }[];
}>;
export type PlayerClassPreset = z.infer<typeof PlayerClassPresetSchema>;
export type PlayerClassPresetDTO = PlayerClassPreset;
