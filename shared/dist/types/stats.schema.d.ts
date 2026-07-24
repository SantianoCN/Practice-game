import { z } from 'zod';
export declare const ArchetypeSchema: z.ZodEnum<["warrior", "mage"]>;
export type Archetype = z.infer<typeof ArchetypeSchema>;
export declare const EntityTypeSchema: z.ZodEnum<["player", "enemy", "bullet", "obstacle", "item"]>;
export type EntityType = z.infer<typeof EntityTypeSchema>;
export declare const EntityStatsSchema: z.ZodObject<{
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
export type EntityStats = z.infer<typeof EntityStatsSchema>;
