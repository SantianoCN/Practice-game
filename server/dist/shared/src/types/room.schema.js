"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomStateSchema = exports.RoomInitSchema = exports.DirectionSchema = exports.RoomTypeSchema = void 0;
const zod_1 = require("zod");
const entity_schema_1 = require("./entity.schema");
exports.RoomTypeSchema = zod_1.z.enum(['Start', 'Normal', 'Boss', 'Treasure', 'Shop']);
exports.DirectionSchema = zod_1.z.enum(['Top', 'Bottom', 'Left', 'Right']);
exports.RoomInitSchema = zod_1.z.object({
    gridX: zod_1.z.number(),
    gridY: zod_1.z.number(),
    type: exports.RoomTypeSchema,
    obstacles: zod_1.z.array(entity_schema_1.ObstacleStateSchema)
});
exports.RoomStateSchema = zod_1.z.object({
    gridX: zod_1.z.number(),
    gridY: zod_1.z.number(),
    isClear: zod_1.z.boolean(),
    type: exports.RoomTypeSchema,
    hasDoors: zod_1.z.object({
        Top: zod_1.z.boolean(),
        Bottom: zod_1.z.boolean(),
        Left: zod_1.z.boolean(),
        Right: zod_1.z.boolean()
    }),
    chests: zod_1.z.array(entity_schema_1.ChestStateSchema),
    droppedItems: zod_1.z.array(entity_schema_1.DroppedItemStateSchema)
});
