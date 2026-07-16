import { io, Socket } from 'socket.io-client';
import { PlayerActionDTO, GameSnapshotDTO, SessionCreateRequestDTO, SessionJoinRequestDTO, ClientEvent, ServerEvent } from '@game/shared';

export class SocketClient {
    private socket: Socket;
    
    constructor(private serverUrl: string) {
        // Создаем сокет сразу, но НЕ подключаемся. 
        // Это позволяет нам повесить все `.on` обработчики до установки соединения.
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
            this.socket.emit(ClientEvent.REQUEST_PROFILE, (res: any) => {
                if (res?.success) resolve(res.login); 
                else reject('Ошибка профиля');
            });
        });
    }

    public createSession(req: SessionCreateRequestDTO): Promise<any> {
        return new Promise(resolve => this.socket.emit(ClientEvent.CREATE_SESSION, req, resolve));
    }

    public joinSession(req: SessionJoinRequestDTO): Promise<any> {
        return new Promise(resolve => this.socket.emit(ClientEvent.CONNECT_SESSION, req, resolve));
    }

    public sendAction(action: PlayerActionDTO): void {
        this.socket.emit(ClientEvent.PLAYER_ACTION, action);
    }

    public leaveSession(): void {
        this.socket.emit(ClientEvent.LEAVE_SESSION);
    }

    public disconnect(): void {
        this.socket.disconnect();
    }

    public onSnapshot(cb: (data: GameSnapshotDTO) => void) { this.socket.on(ServerEvent.SNAPSHOT, cb); }
    public onPlayerId(cb: (id: string) => void) { this.socket.on(ServerEvent.PLAYER_ID, cb); }
    public onClassPresets(cb: (presets: any) => void) { this.socket.on(ServerEvent.CLASS_PRESETS, cb); }
    public onError(cb: (msg: string) => void) { this.socket.on(ServerEvent.ERROR, cb); }
}