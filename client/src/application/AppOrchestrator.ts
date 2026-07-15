import { NetworkService } from "../infrastructure/network/NetworkService";
import { AuthScreenController } from "../presentation/controllers/AuthScreenController";
import { LobbyScreenController } from "../presentation/controllers/LobbyScreenController";
import { GameScreenController } from "../presentation/controllers/GameScreenController";

export class AppOrchestrator {
  private network: NetworkService;
  private authController: AuthScreenController;
  private lobbyController: LobbyScreenController;
  private gameController: GameScreenController;

  private token: string | null = null;
  private sessionId: string | null = null;
  private userLogin: string | null = null;
  private userId: string | null = null;

  constructor() {
    this.network = new NetworkService();
    this.network.onError((msg) => {
      if (msg === 'Выполнен вход с другого устройства') {
        alert('ВНИМАНИЕ: Выполнен вход с другого устройства! Вы были отключены.');
        this.handleLogout(true);
      } else {
        console.error('Критическая ошибка:', msg);
      }
    });

    this.authController = new AuthScreenController((token, login) => this.handleLoginSuccess(token, login));
    
    this.lobbyController = new LobbyScreenController(
      this.network,
      "",
      (sessionId) => this.handleJoinSession(sessionId),
      () => this.handleLogout()
    );

    this.gameController = new GameScreenController(this.network, () => this.handleLeaveSession());

    this.init();
  }

  private async init() {
    this.token = localStorage.getItem('session_token');
    this.sessionId = localStorage.getItem('game_session_id');

    if (!this.token) {
      this.showAuthScreen();
    } else {
      try {
        await this.network.connect(this.token);

        this.network.onClassPresets((presets) => {
          this.lobbyController.updateClassPresets(presets);
        });

        this.network.onPlayerId((playerId) => {
          this.userId = playerId;
        });

        const accountLogin = await this.network.requestProfile();
        this.userLogin = accountLogin;

        if (this.sessionId) {
          this.showGameScreen(this.sessionId, this.userId || '');
        } else {
          this.showLobbyScreen(this.userLogin || 'Рус');
        }
      } catch (err) {
        this.handleLogout();
      }
    }
  }

  private showAuthScreen() {
    this.lobbyController.hide();
    this.gameController.hide();
    this.authController.show();
  }

  private showLobbyScreen(login: string) {
    this.authController.hide();
    this.gameController.hide();
    this.lobbyController.show(login);
  }

  private showGameScreen(sessionId: string, myId: string) {
    this.authController.hide();
    this.lobbyController.hide();
    this.gameController.show(sessionId, myId);
  }

  private async handleLoginSuccess(token: string, login: string) {
    this.token = token;
    this.userLogin = login;
    localStorage.setItem('session_token', token);

    try {
      await this.network.connect(token);

      this.network.onPlayerId((playerId) => {
        this.userId = playerId;
      });

      this.showLobbyScreen(login);

      this.network.onClassPresets((presets) => {
        this.lobbyController.updateClassPresets(presets);
      });
    } catch (err) {
      this.handleLogout();
    }
  }

  private handleJoinSession(sessionId: string) {
    this.sessionId = sessionId;
    localStorage.setItem('game_session_id', sessionId);
    this.showGameScreen(sessionId, this.userId || '');
  }

  private handleLeaveSession() {
    this.gameController.hide();
    this.network.leaveSession();
    localStorage.removeItem('game_session_id');
    this.sessionId = null;

    if (this.token && this.userLogin) {
      this.showLobbyScreen(this.userLogin);
    }
  }

  private async handleLogout(skipServerRequest: boolean = false) {
    if (this.token && !skipServerRequest) {
      try {
        await fetch('http://localhost:3000/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: this.token })
        });
      } catch (err) {
        console.error('Сервер логаута недоступен:', err);
      }
    }

    this.network.disconnect();
    localStorage.removeItem('session_token');
    localStorage.removeItem('game_session_id');
    this.token = null;
    this.sessionId = null;
    this.userLogin = null;
    this.userId = null;
    this.showAuthScreen();
  }
}