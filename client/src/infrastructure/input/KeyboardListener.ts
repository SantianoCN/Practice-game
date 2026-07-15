import { PlayerAction } from '../../../../shared/gameTypes';

export class KeyboardListener {
  private keys: Record<string, boolean> = {};
  private listeners: Array<(action: PlayerAction) => void> = [];

  constructor() {
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (this.keys[event.code]) return; 
    this.keys[event.code] = true;
    this.notifyListeners();
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    this.keys[event.code] = false;
    this.notifyListeners();
  };

  private handleBlur = () => {
    this.clearAllKeys();
  };

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.clearAllKeys();
    }
  };

  public startListening(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  public stopListening(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    
    this.clearAllKeys();
    this.listeners = [];
  }

  private clearAllKeys(): void {
    const hasPressedKeys = Object.values(this.keys).some(value => value === true);
    if (!hasPressedKeys) return;

    this.keys = {};
    console.log('[KeyboardListener] Окно игры потеряло фокус. Сбрасываем инпут на сервер.');
    this.notifyListeners();
  }

  private getPlayerAction(): PlayerAction {
    return {
      keys: {
        up: this.keys['ArrowUp'] || this.keys['KeyW'] || false,
        down: this.keys['ArrowDown'] || this.keys['KeyS'] || false,
        left: this.keys['ArrowLeft'] || this.keys['KeyA'] || false,
        right: this.keys['ArrowRight'] || this.keys['KeyD'] || false,
        attack: this.keys['Space'] || false
      }
    };
  }

  public saveListener(callback: (action: PlayerAction) => void): void {
    this.listeners.push(callback);
  }

  public isPressed(key: string): boolean {
    return this.keys[key] ?? false;
  }

  private notifyListeners(): void {
    const action = this.getPlayerAction();
    this.listeners.forEach(callback => {
      callback(action);
    });
  }

  public getCurrentAction(): PlayerAction {
    return this.getPlayerAction();
  }
}