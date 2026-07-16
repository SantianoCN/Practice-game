import { GameSnapshotDTO } from "@game/shared";
import { GameSnapshot } from "../../domain/config/SnapshotConfigs";

export interface IClientBroadcaster {
    broadcastSnapshot(userId: string, snapshot: GameSnapshotDTO): void;
    broadcastError(userId: string, message: string): void;
}