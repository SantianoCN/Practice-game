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
    this.network = new NetworkClient();
    this.input = new ReadInputs();
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
    this.renderServise = new GameRender(canvas);
    this.lastPlayerAction = {keys: { up: false, down: false, left: false, right: false, shoot: false }};
    this.isRunning = false;
    this.snapshot = {
      players: [],
      enemies: [],
      bullets: []
    };
  }

  // Изменено: метод стал асинхронным для соблюдения порядка авторизации
  public async startGame() {
    if (this.isRunning) {
      return;
    } else {
      this.isRunning = true;
    }

    try {
      // 1. Подключаемся и ждем фактического коннекта сокета
      await this.network.connect();

      // 2. Проходим авторизацию
      const loginResult = await this.network.login({ login: 'testUser', password: 'testPassword' });
      console.log('Авторизация выполнена успешно:', loginResult);

      // 3. Создаем сессию
      const sessionResult = await this.network.createSession({ name: 'Русич', archetype: 'warrior' });
      console.log('Сессия создана! ID:', sessionResult.sessionId);

    } catch (error) {
      console.error('Не удалось запустить сетевую игру:', error);
      this.isRunning = false;
      return;
    }

    this.input.saveListener((action: PlayerAction) => {
      this.lastPlayerAction = action;
      this.network.sendPlayerAction(action)
    });

    this.network.onSnapshotUpdate((snapshot: GameSnapshot) => {
      this.snapshot = snapshot;
    });

    this.gameLoop();
  }

  public stopGame() {
    this.isRunning = false;
    this.network.disconnect()
  }

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