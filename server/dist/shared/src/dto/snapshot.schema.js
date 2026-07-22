"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameSnapshotSchema = void 0;
const zod_1 = require("zod");
const room_schema_1 = require("../types/room.schema");
const entity_schema_1 = require("../types/entity.schema");
exports.GameSnapshotSchema = zod_1.z.object({
    room: room_schema_1.RoomStateSchema,
    players: zod_1.z.array(entity_schema_1.PlayerStateSchema),
    enemies: zod_1.z.array(entity_schema_1.EnemyStateSchema),
    bullets: zod_1.z.array(entity_schema_1.BulletStateSchema)
});
