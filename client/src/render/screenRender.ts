import { ClientPlayer, ClientEnemy, ClientBullet } from '../entities/ClientEntities';
import { RoomState } from '../../../shared/gameTypes'; // Импортируем тип комнаты

export class GameRender {
  private context: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement; 

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Cannot get 2D context')
    }
    this.context = ctx;
  }

  public render(
    playersMap: Map<string, ClientPlayer>, 
    enemiesMap: Map<string, ClientEnemy>, 
    bulletsMap: Map<string, ClientBullet>,
    room: RoomState | null
  ): void {
    this.clear();
    this.drawScreen(playersMap, enemiesMap, bulletsMap, room);
  }

  private clear(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private drawScreen(
    playersMap: Map<string, ClientPlayer>, 
    enemiesMap: Map<string, ClientEnemy>, 
    bulletsMap: Map<string, ClientBullet>,
    room: RoomState | null
  ): void {
    this.drawMap(room);
    this.drawBullets(bulletsMap);
    this.drawPlayers(playersMap);
    this.drawEnemies(enemiesMap);
    this.drawParticles();
  }

  private drawMap(room: RoomState | null): void {    
    if (!room) {
        this.context.fillStyle = 'white';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        return;
    }

    let floorColor = '#ecf0f1'; 
    if (room.type === 'Start') floorColor = '#eaeded'; 
    if (room.type === 'Boss') floorColor = '#fadbd8';
    if (room.type === 'Treasure') floorColor = '#fef9e7'; 
    if (room.type === 'Shop') floorColor = '#d6eaf8';

    this.context.fillStyle = floorColor;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const doorColor = room.isClear ? '#8e44ad' : '#c0392b'; 
    this.context.fillStyle = doorColor;

    const doorWidth = 100;
    const doorThickness = 15;

    if (room.hasDoors.Top) {
        this.context.fillRect(this.canvas.width / 2 - doorWidth / 2, 0, doorWidth, doorThickness);
    }
    if (room.hasDoors.Bottom) {
        this.context.fillRect(this.canvas.width / 2 - doorWidth / 2, this.canvas.height - doorThickness, doorWidth, doorThickness);
    }
    if (room.hasDoors.Left) {
        this.context.fillRect(0, this.canvas.height / 2 - doorWidth / 2, doorThickness, doorWidth);
    }
    if (room.hasDoors.Right) {
        this.context.fillRect(this.canvas.width - doorThickness, this.canvas.height / 2 - doorWidth / 2, doorThickness, doorWidth);
    }
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