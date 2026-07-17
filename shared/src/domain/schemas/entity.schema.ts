import { z } from 'zod';

// Базовые физические свойства любой сущности на карте
export const BaseEntityStateSchema = z.object({
    id: z.string(),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    visualId: z.string()
});
export type BaseEntityState = z.infer<typeof BaseEntityStateSchema>;

// Стейт Игрока
export const PlayerStateSchema = BaseEntityStateSchema.extend({
    hp: z.number(),
    maxHp: z.number(),
    mana: z.number(),
    maxMana: z.number(),
    gold: z.number(),
    activeWeaponVisualId: z.string()
});
export type PlayerState = z.infer<typeof PlayerStateSchema>;

// Стейт Врага
export const EnemyStateSchema = BaseEntityStateSchema.extend({
    hp: z.number(),
    maxHp: z.number()
});
export type EnemyState = z.infer<typeof EnemyStateSchema>;

// Стейт Снаряда (Пули)
export const BulletStateSchema = BaseEntityStateSchema;
export type BulletState = z.infer<typeof BulletStateSchema>;

// Стейт Выпавшего Предмета (Лута)
export const DroppedItemStateSchema = BaseEntityStateSchema;
export type DroppedItemState = z.infer<typeof DroppedItemStateSchema>;

// Стейт Сундука
export const ChestStateSchema = BaseEntityStateSchema.extend({
    isOpened: z.boolean(),
    gridX: z.number(),
    gridY: z.number()
});
export type ChestState = z.infer<typeof ChestStateSchema>;

// Стейт Препятствия (Стена, колонна)
export const ObstacleStateSchema = BaseEntityStateSchema;
export type ObstacleState = z.infer<typeof ObstacleStateSchema>;