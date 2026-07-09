import { io, Socket } from 'socket.io-client';
import { PlayerAction, LoginData, GameSnapshot, SessionCreateRequest, SessionCreateResponse, SessionJoinRequest, SessionJoinResponse } from '../../../shared/gameTypes';
//import { platform } from 'os';

export class NetworkClient {
  private socket: Socket | null = null;
  private readonly serverUrl: string;
  private UpdateCallback: ((data: GameSnapshot) => void) | null = null;

  constructor(serverUrl: string = 'http://localhost:3000') {
    this.serverUrl = serverUrl;
  }

  public connect(): void {
    if (this.socket) {
      console.log('Соединение уже установлено');
      return;
    }

    this.socket = io(this.serverUrl, { transports: ['websocket'] });

    this.socket.on('connection', () => {
      console.log('Подключено к серверу! ID:', this.socket?.id);
    });

    this.socket.on('snapshot', (data: GameSnapshot) => {
      if (this.UpdateCallback) {
        this.UpdateCallback(data);
      }
    });

    this.socket.on('connect_error', (err: Error) => {
      console.error('Ошибка подключения:', err.message);
    });

    this.socket.on('disconnect', () => {
      console.warn('Отключено от сервера');
    });
  }

  public createSession(request: SessionCreateRequest) {
    return this.emitWithAck<SessionCreateResponse>(
      'create-session', 
      request,
      'session-create-response'
    );
  }

  public joinSession(request: SessionJoinRequest) {
    return this.emitWithAck<SessionJoinResponse>(
      'connect-session',
      request,
      'session-join-response'
    );
  } 
  
  public sendPlayerAction(action: PlayerAction): void {
    if (!this.socket?.connected) {
        console.warn('нет соединения с сервером');
        return;
    }
    this.socket.emit('playerAction', action);
}

  private async emitWithAck<T>(
    event: string, 
    payload: unknown, 
    responseEvent: string
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('нет соединения с сервером'));
        return;
      }
      this.socket.once(responseEvent, (data: T) => resolve(data));
      this.socket.emit(event, payload);
    });
  }

  public onSnapshotUpdate(callback: (data: GameSnapshot) => void): void {
    this.UpdateCallback = callback;
  }

  public login(data: LoginData): Promise<{ success: boolean; message?: string }> {
    return this.emitWithAck('login', data, 'response');
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.emit('savePlayerData', (response: boolean) => {
        if (response) {
          console.log('Сохранение')
        }
      })
      this.socket.disconnect();
      this.socket = null;
    }
  }
}