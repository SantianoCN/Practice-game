import { io, Socket } from 'socket.io-client';
import { PlayerAction, LoginData, GameSnapshot } from '../../../shared/gameTypes';

export class NetworkClient {
  private socket: Socket | null = null;
  private readonly serverUrl: string;
  private UpdateCallback: ((data: GameSnapshot) => void) | null = null;

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

  public onSnapshotUpdate(callback: (data: GameSnapshot) => void): void {
    this.UpdateCallback = callback;
  }

  public sendPlayerAction(action: PlayerAction): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('playerAction', action);
    } else {
      console.warn('Нет соединения с сервером!');
    }
  }

  public sendPlayerLogin(login: LoginData): void {
    if (this.socket && this.socket.connected) { 
      this.socket.emit('login', login)
    } else {
      console.warn('Нет соединения с сервером!')
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.emit('savePlayerData', (response: boolean) => {
        if (response){
          console.log('Сохранение')
        }
      })
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
