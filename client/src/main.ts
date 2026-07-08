import NetworkClient from "./network/NetworClient";
import ReadInputs from "./input/ReadInputs";
import { PlayerAction, LoginData } from '../../shared/gameTypes';
type GameStateData = any; // позже подтягивать

class Game{
  private network: NetworkClient;
  private input: ReadInputs;
  private lastPlayerAction: PlayerAction;
  private isRunning: boolean;
  private gameState: GameStateData

  constructor() {
    this.network = new NetworkClient;
    this.input = new ReadInputs;
    this.lastPlayerAction = {keys: { up: false, down: false, left: false, right: false, shoot: false }};
    this.isRunning = false;
    this.gameState = null
  }

  public startGame() {
    if (this.isRunning) {
      return
    } else {
      this.isRunning = true
    }
    this.network.connect
    this.input.saveListener((action: PlayerAction) => {
      this.lastPlayerAction = action;
      this.network.sendPlayerAction(action)
    })
    this.network.onGameStateUpdate((gameState: GameStateData) => {
      this.gameState = gameState
    })
  }

  public stopGame() {
    this.isRunning = false;
    this.network.disconnect()
  }

  public sendLogin(login: LoginData) {
    this.network.sendPlayerLogin(login)
  }

  public getGameState(): {isRunning: boolean, action: PlayerAction, gameState: GameStateData} {
    return {isRunning: this.isRunning, action: this.lastPlayerAction, gameState: this.gameState}
  }

  public gameLoop() {
    if (!this.isRunning) return

    this.upDateState();

    this.render();

    requestAnimationFrame(() => this.gameLoop)
  }

  private upDateState() {

  }
}