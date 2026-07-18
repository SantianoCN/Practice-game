import { z } from 'zod';
import { RoomStateSchema } from '../types/room.schema';
import { PlayerStateSchema, EnemyStateSchema, BulletStateSchema } from '../types/entity.schema';

export const GameSnapshotSchema = z.object({
    room: RoomStateSchema,
    players: z.array(PlayerStateSchema),
    enemies: z.array(EnemyStateSchema),
    bullets: z.array(BulletStateSchema)
});
export type GameSnapshotDTO = z.infer<typeof GameSnapshotSchema>;