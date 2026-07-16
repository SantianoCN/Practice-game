import { z } from 'zod';
import * as schemas from '../schemas/SnapshotSchemas';

export type RoomType = z.infer<typeof schemas.RoomTypeSchema>;
export type Direction = z.infer<typeof schemas.DirectionSchema>;
export type VectorXY = z.infer<typeof schemas.VectorXYSchema>;

export type BaseNetworkEntityDTO = z.infer<typeof schemas.BaseNetworkEntitySchema>;
export type PlayerSnapshotDTO = z.infer<typeof schemas.PlayerSnapshotSchema>;
export type EnemySnapshotDTO = z.infer<typeof schemas.EnemySnapshotSchema>;
export type BulletSnapshotDTO = z.infer<typeof schemas.BulletSnapshotSchema>;
export type DroppedItemSnapshotDTO = z.infer<typeof schemas.DroppedItemSnapshotSchema>;
export type ChestSnapshotDTO = z.infer<typeof schemas.ChestSnapshotSchema>;
export type RoomSnapshotDTO = z.infer<typeof schemas.RoomSnapshotSchema>;
export type GameSnapshotDTO = z.infer<typeof schemas.GameSnapshotSchema>;