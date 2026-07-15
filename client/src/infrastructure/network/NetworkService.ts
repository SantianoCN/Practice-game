import { io, Socket } from 'socket.io-client';
import { PlayerAction, GameSnapshot, SessionCreateRequest, SessionCreateResponse, SessionJoinRequest, SessionJoinResponse } from '../../../../shared/gameTypes';
import { ClientEvent, ServerEvent } from '../../../../shared/networkEvents';
import { PlayerClassPreset } from '../../../../shared/gameTypes'

export class NetworkService {
  private socket: Socket | null = null;
  private readonly serverUrl: string;
  private UpdateCallback: ((data: GameSnapshot) => void) | null = null;
  private PresetsCallback: ((presets: PlayerClassPreset ) => void) | null = null;
  private PlayerIdCallback: ((playerId: string) => void) | null = null;
  private ErrorCallback: ((msg: string) => void) | null = null; 

  constructor(serverUrl: string = 'http://localhost:3000') {
    this.serverUrl = serverUrl;
  }

  public onError(callback: (msg: string) => void): void {
    this.ErrorCallback = callback;
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

      this.socket.on(ServerEvent.ERROR, (err: any) => {
        const msg = err.message || err;
        console.error('Ошибка от сервера:', msg);
        
        if (this.ErrorCallback) {
            this.ErrorCallback(msg);
        }
        reject(new Error(msg)); // Оставляем reject для первоначального подключения
      });

      this.socket.on(ServerEvent.SNAPSHOT, (data: GameSnapshot) => {
        if (this.UpdateCallback) {
          this.UpdateCallback(data);
        }
      });

      this.socket.on('disconnect', (reason) => {
        // <-- ИЗМЕНИЛИ: Проверяем причину отключения
        if (reason === 'io client disconnect') {
            console.log('[NetworkClient] Отключено от сервера');
        } else if (reason === 'io server disconnect') {
            console.warn('[NetworkClient] Отключено сервером (возможно, кик или вход с другого устройства)');
        } else {
            console.warn('[NetworkClient] Потеряно соединение с сервером. Причина:', reason);
        }
      });

      this.socket.on('class-presets', (presets: PlayerClassPreset) => {
        if (this.PresetsCallback) {
          this.PresetsCallback(presets);
        }
      });

      this.socket.on('player-id', (playerId: string) => {
        console.log('[NetworkClient] Мой персональный ID в игре:', playerId);
        if (this.PlayerIdCallback) {
          this.PlayerIdCallback(playerId);
        }
      });
    });
  }

  public requestProfile(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('нет соединения с сервером'));
        return;
      }

      // Предохранитель на случай, если сервер завис
      const timeout = setTimeout(() => {
        reject(new Error('Сервер не ответил вовремя на запрос профиля'));
      }, 5000);

      // Используем встроенное подтверждение (коллбэк) Socket.io
      this.socket.emit('request-profile', (response: { success: boolean; login?: string }) => {
        clearTimeout(timeout);
        
        if (response.success && response.login) {
          resolve(response.login);
        } else {
          reject(new Error('Не удалось загрузить профиль с сервера'));
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

  public onPlayerId(callback: (playerId: string) => void): void {
    this.PlayerIdCallback = callback;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}