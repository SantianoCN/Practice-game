import { PlayerAction } from '../../../shared/gameTypes';

export class ReadInputs {
  private keys: Record<string, boolean> = {};
  private listeners: Array<(action: PlayerAction) => void> = [];

  constructor() {
    this.listener();
  }

  private listener(): void {
    window.addEventListener('keydown', (event: KeyboardEvent) => {
      this.keys[event.key] = true;
      this.sayListeners();
    });

    window.addEventListener('keyup', (event: KeyboardEvent) => {
      this.keys[event.key] = false;
      this.sayListeners();
    });
  }

  private getPlayerAction(): PlayerAction {
    return {
      keys: {
        up: this.keys['ArrowUp'] || this.keys['w'] || false,
        down: this.keys['ArrowDown'] || this.keys['s'] || false,
        left: this.keys['ArrowLeft'] || this.keys['a'] || false,
        right: this.keys['ArrowRight'] || this.keys['d'] || false,
        shoot: this.keys[' '] || this.keys['Space'] || false,
      }
    };
  }

  public saveListener(callback: (action: PlayerAction) => void): void {
    this.listeners.push(callback);
  }

  public isPressed(key: string): boolean {
    return this.keys[key] ?? false;
  }

  private sayListeners(): void {
    const action = this.getPlayerAction();
    this.listeners.forEach(callback => {
      callback(action);
    });
  }

  public getCurrentAction(): PlayerAction {
    return this.getPlayerAction();
  }
}