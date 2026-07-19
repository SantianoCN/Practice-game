import { Server } from 'socket.io';
import { IClientBroadcaster } from '../../application/interfaces/IClientBroadcaster';
import { GameSnapshotDTO, ServerEvent, RoomInitDTO } from '@game/shared';

export class SocketBroadcaster implements IClientBroadcaster {
    constructor(private io: Server) {}

    public broadcastSnapshot(userId: string, snapshot: GameSnapshotDTO): void {
        this.io.to(userId).emit(ServerEvent.SNAPSHOT, snapshot);
    }

    public broadcastError(userId: string, message: string): void {
        this.io.to(userId).emit(ServerEvent.ERROR, message);
    }

    public broadcastRoomInit(userId: string, roomInit: RoomInitDTO): void {
        this.io.to(userId).emit('server:room-init', roomInit);
    }
}