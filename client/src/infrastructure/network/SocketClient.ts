import { io, Socket } from 'socket.io-client';
import { INetworkClient } from '../../application/interfaces/INetworkClient';
import { 
    PlayerActionDTO,
    GameSnapshotDTO,
    SessionCreateRequestDTO,
    SessionCreateResponseDTO,
    SessionJoinRequestDTO,
    SessionJoinResponseDTO,
    PlayerClassPresetDTO,
    ClientEvent,
    ServerEvent,
    ProfileResponseDTO,
    RoomInitDTO
} from '@game/shared';

export class SocketClient implements INetworkClient {
    private socket: Socket;
    
    constructor(private serverUrl: string) {
        this.socket = io(this.serverUrl, { 
            autoConnect: false, 
            transports: ['websocket'] 
        });
    }

    public connect(token: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.socket.connected) return resolve();
            
            this.socket.auth = { token };
            this.socket.connect();
            
            this.socket.once('connect', () => resolve());
            this.socket.once('connect_error', (err) => reject(err));
        });
    }

    public requestProfile(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.socket.emit(ClientEvent.REQUEST_PROFILE, (res: ProfileResponseDTO) => {
                if (res?.success && res.login) {
                    resolve(res.login);
                } else {
                    reject(res?.message || 'Ошибка профиля');
                }
            });
        });
    }

    public createSession(req: SessionCreateRequestDTO): Promise<SessionCreateResponseDTO> {
        return new Promise(resolve => {
            this.socket.emit(ClientEvent.CREATE_SESSION, req, (res: SessionCreateResponseDTO) => {
                resolve(res);
            });
        });
    }

    public createLobby(req: SessionCreateRequestDTO): Promise<SessionCreateResponseDTO> {
        return new Promise(resolve => {
            this.socket.emit(ClientEvent.CREATE_LOBBY, req, (res: SessionCreateResponseDTO) => {
                resolve(res);
            });
        });
    }

    public joinLobby(req: SessionJoinRequestDTO): Promise<SessionJoinResponseDTO> {
        return new Promise(resolve => {
            this.socket.emit(ClientEvent.CONNECT_LOBBY, req, (res: SessionJoinResponseDTO) => {
                resolve(res);
            });
        });
    }

    public sendStartMatch(): void {
        this.socket.emit(ClientEvent.START_GAME);
    }

    public sendPlayerAction(action: PlayerActionDTO): void {
        this.socket.emit(ClientEvent.PLAYER_ACTION, action);
    }

    public leaveSession(): void {
        this.socket.emit(ClientEvent.LEAVE_SESSION);
    }

    public disconnect(): void {
        this.socket.disconnect();
    }

    public onSnapshot(cb: (snapshot: GameSnapshotDTO) => void): void { 
        this.socket.on(ServerEvent.SNAPSHOT, cb); 
    }
    
    public onPlayerId(cb: (id: string) => void): void { 
        this.socket.on(ServerEvent.PLAYER_ID, cb); 
    }
    
    public onClassPresets(cb: (presets: Record<string, PlayerClassPresetDTO>) => void): void { 
        this.socket.on(ServerEvent.CLASS_PRESETS, cb); 
    }
    
    public onError(cb: (msg: string) => void): void { 
        this.socket.on(ServerEvent.ERROR, cb); 
    }

    public onRoomInit(cb: (data: RoomInitDTO) => void) { 
        this.socket.on('server:room-init', cb); 
    }
}