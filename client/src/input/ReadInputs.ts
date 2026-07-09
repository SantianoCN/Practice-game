import { PlayerAction } from '../../../shared/gameTypes';

export class ReadInputs {
  private keys: Record<string, boolean> = {};
  private listeners: Array<(action: PlayerAction) => void> = [];

  constructor() {
    this.listener();
  }

  private listener(): void {
  window.addEventListener('keydown', (event: KeyboardEvent) => {
    if (this.keys[event.code]) return; 
    this.keys[event.code] = true;
    this.sayListeners();
  });

  window.addEventListener('keyup', (event: KeyboardEvent) => {
    this.keys[event.code] = false;
    this.sayListeners();
  });
}

private getPlayerAction(): PlayerAction {
  return {
    keys: {
      up: this.keys['ArrowUp'] || this.keys['KeyW'] || false,
      down: this.keys['ArrowDown'] || this.keys['KeyS'] || false,
      left: this.keys['ArrowLeft'] || this.keys['KeyA'] || false,
      right: this.keys['ArrowRight'] || this.keys['KeyD'] || false,
      shoot: this.keys['Space'] || false
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