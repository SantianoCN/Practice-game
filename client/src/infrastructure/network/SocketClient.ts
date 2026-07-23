import { io, Socket } from 'socket.io-client';
import { INetworkClient } from '../../application/interfaces/INetworkClient';
import {
    PlayerActionDTO, GameSnapshotDTO, SessionCreateRequestDTO,
    SessionCreateResponseDTO, SessionJoinRequestDTO, SessionJoinResponseDTO,
    PlayerClassPresetDTO, ClientEvent, ServerEvent, RoomInitDTO,
    BuyItemResponseDTO, PlayerProgressDTO
} from '@game/shared';

interface ProfileResult {
    login: string;
    progress?: PlayerProgressDTO;
    activeSaveSessionId?: string | null;
    currentSessionId?: string | null;
    isHost?: boolean;
}

export class SocketClient implements INetworkClient {
    private socket: Socket;

    constructor(private serverUrl: string) {
        this.socket = io(this.serverUrl, {
            autoConnect: false,
            transports: ['websocket']
        });
    }

    public connect(token: string): Promise<ProfileResult> {
        return new Promise((resolve, reject) => {
            this.socket.disconnect();
            this.socket.off('connect');
            this.socket.off('connect_error');
            this.socket.off('disconnect');
            this.socket.auth = { token };
            this.socket.once('connect', () => {
                this.requestProfile()
                    .then(res => resolve(res))
                    .catch(err => reject(err));
            });

            this.socket.once('connect_error', (err) => {
                reject(err);
            });

            this.socket.connect();
        });
    }

    public requestProfile(): Promise<ProfileResult> {
        return new Promise((resolve, reject) => {
            this.socket.emit(ClientEvent.REQUEST_PROFILE, (res: any) => {
                if (res?.success && res.login) {
                    resolve({
                        login: res.login,
                        progress: res.progress,
                        activeSaveSessionId: res.activeSaveSessionId || null,
                        currentSessionId: res.currentSessionId || null,
                        isHost: res.isHost === true
                    });
                } else {
                    reject(res?.message || 'Ошибка профиля');
                }
            });
        });
    }

    public saveAndExit(): Promise<{ success: boolean; message?: string }> {
        return new Promise(resolve => {
            this.socket.emit(ClientEvent.SAVE_AND_EXIT, {}, (res: any) => {
                resolve(res);
            });
        });
    }

    public sendNextFloor(): void {
        this.socket.emit(ClientEvent.NEXT_FLOOR);
    }

    public onPortalInteract(cb: () => void): void {
        this.socket.on(ServerEvent.PORTAL_INTERACT, cb);
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

    public restoreSave(): Promise<{ success: boolean; sessionId?: string; message?: string }> {
        return new Promise(resolve => {
            this.socket.emit(ClientEvent.RESTORE_SAVE, {}, (res: any) => {
                resolve(res);
            });
        });
    }

    public buyItem(itemPresetId: string): Promise<BuyItemResponseDTO> {
        return new Promise(resolve => {
            this.socket.emit(ClientEvent.BUY_ITEM, { itemPresetId }, (res: BuyItemResponseDTO) => {
                resolve(res);
            });
        });
    }

    public completeSession(): Promise<BuyItemResponseDTO> {
        return new Promise(resolve => {
            this.socket.emit(ClientEvent.COMPLETE_SESSION, {}, (res: BuyItemResponseDTO) => {
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
        this.socket.on(ServerEvent.ROOM_INIT, cb);
    }

    public onSyncProgress(cb: (progress: PlayerProgressDTO) => void): void {
        this.socket.on(ServerEvent.SYNC_PROGRESS, cb);
    }

    public onSessionCompleted(cb: (data: { message: string, progress: PlayerProgressDTO }) => void): void {
        this.socket.on(ServerEvent.SESSION_COMPLETED, cb);
    }

    public onSessionTerminated(cb: (data: { message: string }) => void): void {
        this.socket.on(ServerEvent.SESSION_TERMINATED, cb);
    }
}