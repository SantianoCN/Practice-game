import { z } from 'zod';
import { ObstacleStateSchema, ChestStateSchema, DroppedItemStateSchema } from './entity.schema';

export const RoomTypeSchema = z.enum(['Start', 'Normal', 'Boss', 'Treasure', 'Shop']);
export type RoomType = z.infer<typeof RoomTypeSchema>;

export const DirectionSchema = z.enum(['Top', 'Bottom', 'Left', 'Right']);
export type Direction = z.infer<typeof DirectionSchema>;

export const RoomStateSchema = z.object({
    gridX: z.number(),
    gridY: z.number(),
    isClear: z.boolean(),
    type: RoomTypeSchema,
    hasDoors: z.object({
        Top: z.boolean(),
        Bottom: z.boolean(),
        Left: z.boolean(),
        Right: z.boolean()
    }),
    obstacles: z.array(ObstacleStateSchema),
    chests: z.array(ChestStateSchema),
    droppedItems: z.array(DroppedItemStateSchema)
});
export type RoomState = z.infer<typeof RoomStateSchema>;