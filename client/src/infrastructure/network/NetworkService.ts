import { io, Socket } from 'socket.io-client';
import { PlayerAction, GameSnapshot, SessionCreateRequest, SessionCreateResponse, SessionJoinRequest, SessionJoinResponse } from '../../../../shared/gameTypes';
import { ClientEvent, ServerEvent } from '../../../../shared/networkEvents';
import { PlayerClassPreset } from '../../../../shared/gameTypes'

export class NetworkService {
  private socket: Socket | null = null;
  private readonly serverUrl: string;
  private UpdateCallback: ((data: GameSnapshot) => void) | null = null;
  private PresetsCallback: ((presets: PlayerClassPreset ) => void) | null = null;

  constructor(serverUrl: string = 'http://localhost:3000') {
    this.serverUrl = serverUrl;
  }

  public connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket) {
        console.log('Соединение уже установлено');
        resolve();
        return;
      }

      this.socket = io(this.serverUrl, {
        transports: ['websocket'],
        auth: { token: token }
      });

      this.socket.on('connect', () => {
        console.log('Подключено к серверу! ID:', this.socket?.id);
        resolve();
      });

      this.socket.on(ServerEvent.ERROR, (err: Error) => {
        console.error('Ошибка подключения:', err.message);
        reject(err);
      });

      this.socket.on(ServerEvent.SNAPSHOT, (data: GameSnapshot) => {
        if (this.UpdateCallback) {
          this.UpdateCallback(data);
        }
      });

      this.socket.on('disconnect', () => {
        console.warn('Отключено от сервера');
      });

      this.socket.on('class-presets', (presets: PlayerClassPreset) => {
        if (this.PresetsCallback) {
          this.PresetsCallback(presets);
        }
      });
    });
  }

  public onClassPresets(callback: (presets: PlayerClassPreset) => void): void {
    this.PresetsCallback = callback;
  }

  public createSession(request: SessionCreateRequest) {
    return this.emitWithAck<SessionCreateResponse>(
      ClientEvent.CREATE_SESSION,
      request,
      ServerEvent.SESSION_CREATE_RESPONSE
    );
  }

  public joinSession(request: SessionJoinRequest) {
    return this.emitWithAck<SessionJoinResponse>(
      ClientEvent.CONNECT_SESSION,
      request,
      ServerEvent.SESSION_JOIN_RESPONSE
    );
  }

  public leaveSession(): void {
    if (!this.socket?.connected) {
      console.warn('нет соединения с сервером');
      return;
    }
    this.socket.emit(ClientEvent.LEAVE_SESSION);
  }

  public sendPlayerAction(action: PlayerAction): void {
    if (!this.socket?.connected) {
      console.warn('нет соединения с сервером');
      return;
    }
    this.socket.emit(ClientEvent.PLAYER_ACTION, action);
  }

  private emitWithAck<T>(event: string, payload: unknown, responseEvent: string): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('нет соединения с сервером'));
        return;
      }

      const handler = (data: T) => {
        clearTimeout(timeout);
        resolve(data);
      };

      const timeout = setTimeout(() => {
        this.socket?.off(responseEvent, handler);
        reject(new Error('сервер не ответил вовремя'));
      }, 5000);

      this.socket.once(responseEvent, handler);
      this.socket.emit(event, payload);
    });
  }

  public onSnapshotUpdate(callback: (data: GameSnapshot) => void): void {
    this.UpdateCallback = callback;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}