import { z } from 'zod';

export const RoomTypeSchema = z.enum(['Start', 'Normal', 'Boss', 'Treasure', 'Shop']);
export const DirectionSchema = z.enum(['Top', 'Bottom', 'Left', 'Right']);

export const VectorXYSchema = z.object({
    x: z.number(),
    y: z.number()
});

export const BaseNetworkEntitySchema = z.object({
    id: z.string(),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    sprite: z.string()
});

export const PlayerSnapshotSchema = BaseNetworkEntitySchema.extend({
    hp: z.number(),
    maxHp: z.number(),
    mana: z.number(),
    maxMana: z.number(),
    gold: z.number(),
    activeWeaponSprite: z.string()
});

export const EnemySnapshotSchema = BaseNetworkEntitySchema.extend({
    hp: z.number(),
    maxHp: z.number()
});

export const BulletSnapshotSchema = BaseNetworkEntitySchema;
export const DroppedItemSnapshotSchema = BaseNetworkEntitySchema;

export const ChestSnapshotSchema = BaseNetworkEntitySchema.extend({
    isOpened: z.boolean(),
    gridX: z.number(),
    gridY: z.number()
});

export const RoomSnapshotSchema = z.object({
    gridX: z.number(),
    gridY: z.number(),
    isClear: z.boolean(),
    hasDoors: z.object({
    Top: z.boolean(),
    Bottom: z.boolean(),
    Left: z.boolean(),
    Right: z.boolean()
}),
    type: RoomTypeSchema,
    obstacles: z.array(BaseNetworkEntitySchema),
    chests: z.array(ChestSnapshotSchema),
    droppedItems: z.array(DroppedItemSnapshotSchema)
});

export const GameSnapshotSchema = z.object({
    room: RoomSnapshotSchema,
    players: z.array(PlayerSnapshotSchema),
    enemies: z.array(EnemySnapshotSchema),
    bullets: z.array(BulletSnapshotSchema)
});