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

  constructor() {
    this.network = new NetworkService();

    this.authController = new AuthScreenController((token) => this.handleLoginSuccess(token));
    
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

        if (this.sessionId) {
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
    this.lobbyController.hide();
    this.gameController.hide();
    this.authController.show();
  }

  private showLobbyScreen(token: string) {
    this.authController.hide();
    this.gameController.hide();
    this.lobbyController.show(token);
  }

  private showGameScreen(sessionId: string) {
    this.authController.hide();
    this.lobbyController.hide();
    this.gameController.show(sessionId);
  }

  private async handleLoginSuccess(token: string) {
    this.token = token;
    localStorage.setItem('session_token', token);

    try {
      await this.network.connect(token);
      this.showLobbyScreen(token);
      
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
    this.showGameScreen(sessionId);
  }

  private handleLeaveSession() {
    this.gameController.hide();
    
    this.network.leaveSession(); 
    
    localStorage.removeItem('game_session_id');
    this.sessionId = null;

    if (this.token) {
      this.showLobbyScreen(this.token);
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