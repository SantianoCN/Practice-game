import { z } from 'zod';

export const BaseEntityStateSchema = z.object({
    id: z.string(),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    visualId: z.string()
});
export type BaseEntityState = z.infer<typeof BaseEntityStateSchema>;

export const PlayerStateSchema = BaseEntityStateSchema.extend({
    hp: z.number(),
    maxHp: z.number(),
    mana: z.number(),
    maxMana: z.number(),
    gold: z.number(),
    activeWeaponVisualId: z.string()
});
export type PlayerState = z.infer<typeof PlayerStateSchema>;

export const EnemyStateSchema = BaseEntityStateSchema.extend({
    hp: z.number(),
    maxHp: z.number()
});
export type EnemyState = z.infer<typeof EnemyStateSchema>;

export const BulletStateSchema = BaseEntityStateSchema;
export type BulletState = z.infer<typeof BulletStateSchema>;

export const DroppedItemStateSchema = BaseEntityStateSchema;
export type DroppedItemState = z.infer<typeof DroppedItemStateSchema>;

export const ChestStateSchema = BaseEntityStateSchema.extend({
    gridX: z.number(),
    gridY: z.number()
});
export type ChestState = z.infer<typeof ChestStateSchema>;

export const ObstacleStateSchema = BaseEntityStateSchema;
export type ObstacleState = z.infer<typeof ObstacleStateSchema>;