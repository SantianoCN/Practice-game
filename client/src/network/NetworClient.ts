import { io, Socket } from 'socket.io-client';
import { PlayerAction } from '../../../shared/gameTypes';
type GameStateData = any; // позже подтягивать

class NetworkClient {
  private socket: Socket | null = null;
  private readonly serverUrl: string;
  private UpdateCallback: ((data: GameStateData) => void) | null = null;

  constructor(serverUrl: string = 'http://26.218.158.162:3000') {
    this.serverUrl = serverUrl;
  }

  public connect(): void {
    if (this.socket) {
      console.log('Соединение уже установлено');
      return;
    }

    this.socket = io(this.serverUrl, { transports: ['websocket'] });

    this.socket.on('connect', () => {
      console.log('Подключено к серверу! ID:', this.socket?.id);
    });

    this.socket.on('gameStateUpdate', (data: GameStateData) => {
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

  public onGameStateUpdate(callback: (data: GameStateData) => void): void {
    this.UpdateCallback = callback;
  }

  public sendPlayerAction(action: PlayerAction): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('playerAction', action);
    } else {
      console.warn('Нет соединения с сервером!');
    }
  }

  public sendPlayerLogin(login: string): void {
    if (this.socket && this.socket.connected) { 
      this.socket.emit('playerLogin', login);
    } else {
      console.warn('Нет соединения с сервером!');
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default NetworkClient;