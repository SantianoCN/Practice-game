import { NetworkService } from '../../infrastructure/network/NetworkService';
import { KeyboardListener } from '../../infrastructure/input/KeyboardListener';
import { CanvasRenderer } from '../render/CanvasRenderer';
import { PlayerAction, GameSnapshot, BaseNetworkEntity } from '../../../../shared/gameTypes';
import { BulletEntity } from '../../domain/entities/BulletEntity';
import { PlayerEntity } from '../../domain/entities/PlayerEntity';
import { EnemyEntity } from '../../domain/entities/EnemyEntity';

export class GameScreenController {
  private container: HTMLDivElement;
  private sessionDisplay: HTMLSpanElement;
  private disconnectBtn: HTMLButtonElement;
  private copyBtn: HTMLButtonElement;

  private network: NetworkService;
  private input: KeyboardListener;
  private renderService: CanvasRenderer;
  private lastPlayerAction: PlayerAction;
  private currentRoomState: any = null;
  private myId: string = '';

  private isRunning: boolean = false;
  private lastFrameTime: number = performance.now();
  private animationFrameId: number | null = null;

  private playersMap: Map<string, PlayerEntity> = new Map();
  private enemiesMap: Map<string, EnemyEntity> = new Map();
  private bulletsMap: Map<string, BulletEntity> = new Map();

  private onDisconnect: () => void;

  constructor(network: NetworkService, onDisconnect: () => void) {
    this.container = document.getElementById('game-screen') as HTMLDivElement;
    this.sessionDisplay = document.getElementById('sessionDisplay') as HTMLSpanElement;
    this.disconnectBtn = document.getElementById('disconnectBtn') as HTMLButtonElement;
    this.copyBtn = document.getElementById('copySessionBtn') as HTMLButtonElement;

    this.network = network;
    this.onDisconnect = onDisconnect;

    this.input = new KeyboardListener();
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.renderService = new CanvasRenderer(canvas);

    this.lastPlayerAction = { keys: { up: false, down: false, left: false, right: false, attack: false } };
    this.init();
  }

  public show(sessionId: string, myId: string): void {
    this.container.classList.remove('hidden');
    this.sessionDisplay.innerText = sessionId;
    this.isRunning = true;
    this.currentRoomState = null; 
    this.renderService.reset();
    this.playersMap.clear();
    this.enemiesMap.clear();
    this.bulletsMap.clear();
    this.myId = myId;

    this.input.startListening();
    this.input.saveListener((action: PlayerAction) => {
      this.lastPlayerAction = action;
      this.network.sendPlayerAction(action);
    });

    this.network.onSnapshotUpdate((snapshot: GameSnapshot) => {
      this.reconcileEntities(snapshot);
    });

    if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
    }

    this.lastFrameTime = performance.now();
    this.gameLoop();
  }

  public hide(): void {
    this.input.stopListening();
    this.isRunning = false;
    if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
    }
    this.container.classList.add('hidden');
  }

  private init(): void {
    this.copyBtn.addEventListener('click', () => {
      this.copyId();
    });
    this.disconnectBtn.addEventListener('click', () => {
      this.onDisconnect();
    });
  }

  private copyId(): void {
    const rawText = this.sessionDisplay.innerText || '';
        
    const sessionId = rawText.includes(':') 
        ? rawText.split(':')[1].trim() 
        : rawText.trim();

    if (sessionId) {
        navigator.clipboard.writeText(sessionId).then(() => {
            const originalText = this.copyBtn.innerText;
            this.copyBtn.innerText = 'СКОПИРОВАНО!';
            
            this.copyBtn.classList.remove('button-primary');
            this.copyBtn.classList.add('button-success');
            
            setTimeout(() => {
                this.copyBtn.innerText = originalText;
                this.copyBtn.classList.remove('button-success');
                this.copyBtn.classList.add('button-primary');
            }, 1200);
        }).catch(err => {
            console.error('Не удалось скопировать свиток с ID:', err);
        });
    }
  }

  private reconcileEntities(snapshot: GameSnapshot) {
    const activeIds = new Set<string>();
    this.currentRoomState = snapshot.room; 

    snapshot.players.forEach(serverPlayer => {
      activeIds.add(serverPlayer.id);
      const localPlayer = this.playersMap.get(serverPlayer.id);

      if (!localPlayer) {
        const newPlayer = new PlayerEntity(
          serverPlayer.id,
          serverPlayer.x,
          serverPlayer.y,
          32,
          32,
          serverPlayer.hp,
          serverPlayer.maxHp,
          serverPlayer.mana,
          serverPlayer.maxMana,
          serverPlayer.sprite
        );
        newPlayer.lastFacing = 'right'; // Дефолтное направление взгляда при спавне
        this.playersMap.set(serverPlayer.id, newPlayer);
      } else {
        // РАСЧЕТ НАПРАВЛЕНИЯ ИГРОКА ПО ИЗМЕНЕНИЮ КООРДИНАТ СЕРВЕРА
        if (serverPlayer.x < localPlayer.targetX) {
          localPlayer.lastFacing = 'left';
        } else if (serverPlayer.x > localPlayer.targetX) {
          localPlayer.lastFacing = 'right';
        }

        localPlayer.targetX = serverPlayer.x;
        localPlayer.targetY = serverPlayer.y;
        localPlayer.hp = serverPlayer.hp;
        localPlayer.maxHp = serverPlayer.maxHp;
        localPlayer.mana = serverPlayer.mana;
        localPlayer.maxMana = serverPlayer.maxMana;
        localPlayer.sprite = serverPlayer.sprite;
      }
    });

    snapshot.room.enemies.forEach(serverEnemy => {
      activeIds.add(serverEnemy.id);
      const localEnemy = this.enemiesMap.get(serverEnemy.id);

      if (!localEnemy) {
        const newEnemy = new EnemyEntity(
          serverEnemy.id,
          serverEnemy.x,
          serverEnemy.y,
          32,
          32,
          serverEnemy.hp,
          serverEnemy.maxHp,
          serverEnemy.sprite
        );
        newEnemy.lastFacing = 'right'; // Дефолтное направление взгляда при спавне
        this.enemiesMap.set(serverEnemy.id, newEnemy);
      } else {
        // РАСЧЕТ НАПРАВЛЕНИЯ ВРАГА ПО ИЗМЕНЕНИЮ КООРДИНАТ СЕРВЕРА
        if (serverEnemy.x < localEnemy.targetX) {
          localEnemy.lastFacing = 'left';
        } else if (serverEnemy.x > localEnemy.targetX) {
          localEnemy.lastFacing = 'right';
        }

        localEnemy.targetX = serverEnemy.x;
        localEnemy.targetY = serverEnemy.y;
        localEnemy.hp = serverEnemy.hp;
        localEnemy.maxHp = serverEnemy.maxHp;
        localEnemy.sprite = serverEnemy.sprite;
      }
    });

    snapshot.bullets.forEach(serverBullet => {
      activeIds.add(serverBullet.id);
      const localBullet = this.bulletsMap.get(serverBullet.id);

      if (!localBullet) {
        const newBullet = new BulletEntity(
          serverBullet.id,
          serverBullet.x,
          serverBullet.y,
          8,
          8,
        );
        newBullet.sprite = serverBullet.sprite;
        this.bulletsMap.set(serverBullet.id, newBullet);
      } else {
        const dx = serverBullet.x - localBullet.targetX;
        const dy = serverBullet.y - localBullet.targetY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
          localBullet.speed = distance / 0.05; 
        }
        localBullet.targetX = serverBullet.x;
        localBullet.targetY = serverBullet.y;
        localBullet.sprite = serverBullet.sprite; 
      }
    });

    for (const [id, player] of this.playersMap.entries()) {
      if (!activeIds.has(id)) player.isDying = true;
    }
    for (const [id, enemy] of this.enemiesMap.entries()) {
      if (!activeIds.has(id)) enemy.isDying = true;
    }
    for (const [id, bullet] of this.bulletsMap.entries()) {
      if (!activeIds.has(id)) bullet.isDying = true;
    }
  }


  private gameLoop() {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const dt = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;

    this.playersMap.forEach((player, id) => {
      player.updateInterpolation(dt);
      if (player.isDying && player.hasReachedTarget()) this.playersMap.delete(id);
    });
    this.enemiesMap.forEach((enemy, id) => {
      enemy.updateInterpolation(dt);
      if (enemy.isDying && enemy.hasReachedTarget()) this.enemiesMap.delete(id);
    });
    this.bulletsMap.forEach((bullet, id) => {
      bullet.updateInterpolation(dt);
      if (bullet.isDying && bullet.hasReachedTarget()) this.bulletsMap.delete(id);
    });

    this.renderService.render(
        this.playersMap, 
        this.enemiesMap, 
        this.bulletsMap, 
        this.currentRoomState,
        this.myId
    );

    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
  }
}