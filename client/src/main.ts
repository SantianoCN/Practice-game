import { NetworkClient } from "./network/NetworClient";
import { ReadInputs } from "./input/ReadInputs";
import { GameRender } from "./render/screenRender";
import { PlayerAction, GameSnapshot } from '../../shared/gameTypes';

class Game{
  private network: NetworkClient;
  private input: ReadInputs;
  private renderServise: GameRender;
  private lastPlayerAction: PlayerAction;
  private isRunning: boolean;
  private snapshot: GameSnapshot

  constructor() {
    this.network = new NetworkClient;
    this.input = new ReadInputs;
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
    this.renderServise = new GameRender(canvas);
    this.lastPlayerAction = {keys: { up: false, down: false, left: false, right: false, shoot: false }};
    this.isRunning = false;
    this.snapshot = {
      players: [],
      room: {
        gridX: 0,
        gridY: 0,
        isClear: false,
        hasDoors: {
          Top: false,
          Bottom: false,
          Right: false,
          Left: false,
        },
        respawnedEntity: [],
        enemies: [],
        distansToSpawn: 0,
        type: 'Start',
      },
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
    });
    this.network.onSnapshotUpdate((snapshot: GameSnapshot) => {
      this.snapshot = snapshot
    });
    this.gameLoop();
  }

  public stopGame() {
    this.isRunning = false;
    this.network.disconnect()
  }

  /*public sendLogin(login: LoginData) {
    this.network.sendPlayerLogin(login)
  }*/

  public getSnapshot(): {isRunning: boolean, action: PlayerAction, snapshot: GameSnapshot} {
    return {isRunning: this.isRunning, action: this.lastPlayerAction, snapshot: this.snapshot}
  }

  public gameLoop() {
    if (!this.isRunning) return

    this.renderServise.render(this.snapshot);

    requestAnimationFrame(() => this.gameLoop())
  }
}

const game = new Game();
game.startGame();