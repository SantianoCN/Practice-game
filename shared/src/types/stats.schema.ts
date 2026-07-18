import { z } from 'zod';

export const ArchetypeSchema = z.enum(['warrior', 'mage']);
export type Archetype = z.infer<typeof ArchetypeSchema>;

export const EntityTypeSchema = z.enum(['player', 'enemy', 'bullet', 'obstacle', 'item']);
export type EntityType = z.infer<typeof EntityTypeSchema>;

export const EntityStatsSchema = z.object({
    maxHp: z.number(),
    maxMana: z.number(),
    speed: z.number(),
    visualId: z.string(),
    archetype: ArchetypeSchema
});
export type EntityStats = z.infer<typeof EntityStatsSchema>;