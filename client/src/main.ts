import { NetworkClient } from "./network/NetworkClient";
import { AuthView } from "./views/AuthView";
import { LobbyView } from "./views/LobbyView";
import { GameView } from "./views/GameView";

class MainController {
  private network: NetworkClient;
  private authView: AuthView;
  private lobbyView: LobbyView;
  private gameView: GameView;

  private token: string | null = null;
  private sessionId: string | null = null;

  constructor() {
    this.network = new NetworkClient();
    this.authView = new AuthView((token) => this.handleLoginSuccess(token));
    this.lobbyView = new LobbyView(
      this.network,
      "",
      (sessionId) => this.handleJoinSession(sessionId),
      () => this.handleLogout()
    );
    this.gameView = new GameView(this.network, () => this.handleLeaveSession());

    this.init();
  }

  private async init() {
    this.token = localStorage.getItem('session_token');
    this.sessionId = localStorage.getItem('game_session_id');

    if (!this.token) {
      this.showAuthScreen();
    } else {
      try {
        // Подключаем сокет под существующим токеном
        await this.network.connect(this.token);

        if (this.sessionId) {
          // Если игрок вылетел во время боя, возвращаем на Canvas
          this.showGameScreen(this.sessionId);
        } else {
          this.showLobbyScreen(this.token);
        }
      } catch (err) {
        this.handleLogout();
      }
    }
  }

  private showAuthScreen() {
    this.lobbyView.hide();
    this.gameView.hide();
    this.authView.show();
  }

  private showLobbyScreen(token: string) {
    this.authView.hide();
    this.gameView.hide();
    this.lobbyView.show(token);
  }

  private showGameScreen(sessionId: string) {
    this.authView.hide();
    this.lobbyView.hide();
    this.gameView.show(sessionId);
  }

  private async handleLoginSuccess(token: string) {
    this.token = token;
    localStorage.setItem('session_token', token);
    this.network.disconnect();
    this.network.connect(token);

    try {
      await this.network.connect(token);
      this.showLobbyScreen(token);
    } catch (err) {
      this.handleLogout();
    }
  }

  private handleJoinSession(sessionId: string) {
    this.sessionId = sessionId;
    localStorage.setItem('game_session_id', sessionId);
    this.showGameScreen(sessionId);
  }

  private handleLeaveSession() {
    this.gameView.hide();
    
    this.network.disconnect();
    
    localStorage.removeItem('game_session_id');
    this.sessionId = null;

    if (this.token) {
      // Быстро переподключаем сокет для лобби
      this.network.connect(this.token).then(() => {
        this.showLobbyScreen(this.token!);
      }).catch(() => {
        this.handleLogout();
      });
    }
  }

  private async handleLogout() {
    if (this.token) {
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
    this.showAuthScreen();
  }
}

new MainController();