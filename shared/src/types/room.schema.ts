import { z } from 'zod';
import { ObstacleStateSchema, ChestStateSchema, DroppedItemStateSchema, PortalStateSchema } from './entity.schema';

export const RoomTypeSchema = z.enum(['Start', 'Normal', 'Boss', 'Treasure', 'Shop']);
export type RoomType = z.infer<typeof RoomTypeSchema>;

export const DirectionSchema = z.enum(['Top', 'Bottom', 'Left', 'Right']);
export type Direction = z.infer<typeof DirectionSchema>;

export const RoomInitSchema = z.object({
    gridX: z.number(),
    gridY: z.number(),
    type: RoomTypeSchema,
    obstacles: z.array(ObstacleStateSchema)
});
export type RoomInitDTO = z.infer<typeof RoomInitSchema>;

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
    chests: z.array(ChestStateSchema),
    droppedItems: z.array(DroppedItemStateSchema),
    portal: PortalStateSchema.nullable().optional()
});
export type RoomState = z.infer<typeof RoomStateSchema>;