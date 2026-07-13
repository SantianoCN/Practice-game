import { NetworkClient } from '../network/NetworkClient';

export class LobbyView {
  private container: HTMLDivElement;
  private welcomeText: HTMLDivElement;
  private createRoomBtn: HTMLButtonElement;
  private joinRoomBtn: HTMLButtonElement;
  private sessionIdInput: HTMLInputElement;
  private lobbyError: HTMLDivElement;
  private logoutBtn: HTMLButtonElement;

  private network: NetworkClient;
  private token: string;
  
  private onJoinSession: (sessionId: string) => void;
  private onLogout: () => void;

  constructor(
    network: NetworkClient,
    token: string,
    onJoinSession: (sessionId: string) => void,
    onLogout: () => void
  ) {
    this.container = document.getElementById('lobby-screen') as HTMLDivElement;
    this.welcomeText = document.getElementById('welcomeText') as HTMLDivElement;
    this.createRoomBtn = document.getElementById('createRoomBtn') as HTMLButtonElement;
    this.joinRoomBtn = document.getElementById('joinRoomBtn') as HTMLButtonElement;
    this.sessionIdInput = document.getElementById('sessionIdInput') as HTMLInputElement;
    this.lobbyError = document.getElementById('lobbyError') as HTMLDivElement;
    this.logoutBtn = document.getElementById('logoutBtn') as HTMLButtonElement;

    this.network = network;
    this.token = token;
    this.onJoinSession = onJoinSession;
    this.onLogout = onLogout;

    this.init();
  }

  public show(token: string): void {
    this.token = token;
    this.welcomeText.innerText = `Рады видеть тебя, Рус по имени ${token}!`;
    this.container.classList.remove('hidden');
    this.lobbyError.style.display = 'none';
  }

  public hide(): void {
    this.container.classList.add('hidden');
  }

  private init(): void {
    this.createRoomBtn.addEventListener('click', async () => {
      try {
        const res = await this.network.createSession({ name: this.token, archetype: 'warrior' });
        if (res.success && res.sessionId) {
          this.onJoinSession(res.sessionId);
        } else {
          this.showError(res.message || 'Не удалось создать комнату');
        }
      } catch (err) {
        this.showError('Не удалось создать комнату');
      }
    });

    this.joinRoomBtn.addEventListener('click', async () => {
      const sessionId = this.sessionIdInput.value.trim();
      if (!sessionId) {
        this.showError('Введите ID сессии');
        return;
      }

      try {
        const res = await this.network.joinSession({ sessionId, name: this.token, archetype: 'warrior' });
        if (res.success && res.sessionId) {
          this.onJoinSession(res.sessionId);
        } else {
          this.showError(res.message || 'Не удалось подключиться к сессии');
        }
      } catch (err) {
        this.showError('Комната не найдена или сервер недоступен');
      }
    });

    this.logoutBtn.addEventListener('click', () => {
      this.onLogout();
    });
  }

  private showError(message: string): void {
    this.lobbyError.innerText = message;
    this.lobbyError.style.display = 'block';
  }
}