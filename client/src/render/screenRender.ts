import { GameSnapshot, Player, Entity, Bullet } from '../../../shared/gameTypes';

export class GameRender {
  private context: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement; 
  private cameraX: number = 0;
  private cameraY: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Cannot get 2D context')
    }
    this.context = ctx
  }

  public render(snapshot: GameSnapshot): void {
    this.clear();
    this.drawScreen(snapshot)
  }

  private clear(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private drawScreen(snapshot: GameSnapshot): void {
    this.cameraX = 0;
    this.cameraY = 0;

    this.drawMap();
    this.drawBullets(snapshot.bullets);
    this.drawPlayers(snapshot.players);
    this.drawEnemies(snapshot.enemies);
    this.drawParticles();
  }

  private drawMap(): void {    
    this.context.fillStyle = 'white';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private drawBullets(bulets: Bullet[]): void {
    bulets.forEach(bullet => {
      this.context.fillStyle = 'black';
      this.context.fillRect(bullet.x - bullet.width / 2, bullet.y - bullet.height / 2, bullet.width, bullet.height)
    })
  }
  
  private drawPlayers(players: Player[]): void {
    players.forEach(player => {
      this.context.fillStyle ='green';
      this.context.fillRect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height)
    });
  }

  private drawEnemies(enemys: Entity[]): void {
    enemys.forEach(enemy => {
      this.context.fillStyle ='red';
      this.context.fillRect(enemy.x - enemy.width / 2, enemy.y - enemy.height / 2, enemy.width, enemy.height)
    });
  }

  private drawParticles(): void {
    
  }

}