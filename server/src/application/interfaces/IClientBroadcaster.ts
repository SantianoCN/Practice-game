import { GameSnapshotDTO} from "@game/shared";

export interface IClientBroadcaster {
    broadcastSnapshot(userId: string, snapshot: GameSnapshotDTO): void;
    broadcastError(userId: string, message: string): void;
    broadcastPortalInteract(userId: string): void;
    broadcastGameOver(userId: string): void;
}