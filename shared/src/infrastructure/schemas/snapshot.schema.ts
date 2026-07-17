// shared/src/infrastructure/schemas/snapshot.schema.ts
import { z } from 'zod';
import { RoomStateSchema } from '../../domain/schemas/room.schema';
import { PlayerStateSchema, EnemyStateSchema, BulletStateSchema } from '../../domain/schemas/entity.schema';

// Снапшот игры — это просто композиция чистых состояний домена!
export const GameSnapshotSchema = z.object({
    room: RoomStateSchema,
    players: z.array(PlayerStateSchema),
    enemies: z.array(EnemyStateSchema),
    bullets: z.array(BulletStateSchema)
});
export type GameSnapshotDTO = z.infer<typeof GameSnapshotSchema>;