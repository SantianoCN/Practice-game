import { ClientPlayer, ClientEnemy, ClientBullet } from '../entities/ClientEntities';

export class GameRender {
  private context: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement; 

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Cannot get 2D context')
    }
    this.context = ctx
  }

  public render(playersMap: Map<string, ClientPlayer>, enemiesMap: Map<string, ClientEnemy>, bulletsMap: Map<string, ClientBullet>): void {
    this.clear();
    this.drawScreen(playersMap, enemiesMap, bulletsMap);
  }

  private clear(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private drawScreen(playersMap: Map<string, ClientPlayer>, enemiesMap: Map<string, ClientEnemy>, bulletsMap: Map<string, ClientBullet>): void {
    this.drawMap();
    this.drawBullets(bulletsMap);
    this.drawPlayers(playersMap);
    this.drawEnemies(enemiesMap);
    this.drawParticles();
  }

  private drawMap(): void {    
    this.context.fillStyle = 'white';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private drawBullets(bulletsMap: Map<string, ClientBullet>): void {
    bulletsMap.forEach(bullet => {
      this.context.fillStyle = 'black';
      
      this.context.fillRect(
        bullet.renderX - bullet.width / 2, 
        bullet.renderY - bullet.height / 2, 
        bullet.width, 
        bullet.height
      );
    });
  }
  
  private drawPlayers(playersMap: Map<string, ClientPlayer>): void {
    playersMap.forEach(player => {
      this.context.fillStyle = 'green';
      
      this.context.fillRect(
        player.renderX - player.width / 2, 
        player.renderY - player.height / 2, 
        player.width, 
        player.height
      );
    });
  }

  private drawEnemies(enemiesMap: Map<string, ClientEnemy>): void {
    enemiesMap.forEach(enemy => {
      this.context.fillStyle = 'red';
      
      this.context.fillRect(
        enemy.renderX - enemy.width / 2, 
        enemy.renderY - enemy.height / 2, 
        enemy.width, 
        enemy.height
      );
    });
  }

  private drawParticles(): void {
    
  }

}