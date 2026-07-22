import { GameSnapshotDTO, RoomInitDTO } from "@game/shared";

export interface IClientBroadcaster {
    broadcastSnapshot(userId: string, snapshot: GameSnapshotDTO): void;
    broadcastRoomInit(userId: string, roomInit: RoomInitDTO): void; 
    broadcastError(userId: string, message: string): void;
    broadcastPortalInteract(userId: string): void;
}