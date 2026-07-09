import { NetworkClient } from "./network/NetworClient";
import { ReadInputs } from "./input/ReadInputs";
import { PlayerAction, LoginData, GameSnapshot } from '../../shared/gameTypes';

class Game{
  private network: NetworkClient;
  private input: ReadInputs;
  private lastPlayerAction: PlayerAction;
  private isRunning: boolean;
  private snapshot: GameSnapshot

  constructor() {
    this.network = new NetworkClient;
    this.input = new ReadInputs;
    this.lastPlayerAction = {keys: { up: false, down: false, left: false, right: false, shoot: false }};
    this.isRunning = false;
    this.snapshot = {
      players: [],
      enemies: [],
      bullets: []
    };
  }

  public startGame() {
    if (this.isRunning) {
      return
    } else {
      this.isRunning = true
    }
    this.network.connect();
    this.input.saveListener((action: PlayerAction) => {
      this.lastPlayerAction = action;
      this.network.sendPlayerAction(action)
    })
    this.network.onSnapshotUpdate((snapshot: GameSnapshot) => {
      this.snapshot = snapshot
    })
  }

  public stopGame() {
    this.isRunning = false;
    this.network.disconnect()
  }

  public sendLogin(login: LoginData) {
    this.network.sendPlayerLogin(login)
  }

  public getSnapshot(): {isRunning: boolean, action: PlayerAction, snapshot: GameSnapshot} {
    return {isRunning: this.isRunning, action: this.lastPlayerAction, snapshot: this.snapshot}
  }

  public gameLoop() {
    if (!this.isRunning) return

    this.render(this.snapshot);

    requestAnimationFrame(() => this.gameLoop())
  }

  private render(snapshot: GameSnapshot) {
    
  }

}