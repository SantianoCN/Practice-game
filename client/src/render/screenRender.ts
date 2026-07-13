import { GameSnapshot, Player, Entity, Bullet } from '../../../shared/gameTypes';

export class GameRender {
  private context: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement; 
  private visitedMatrix: number[][] = [];
  private readonly matrixSize = 7;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Cannot get 2D context')
    }
    this.context = ctx;

    this.initVisitedMatrix()
  }

  private initVisitedMatrix(): void {
    this.visitedMatrix = Array(this.matrixSize).fill(null).map(() => 
      Array(this.matrixSize).fill(0))
  }

  public render(snapshot: GameSnapshot): void {
    this.updateVisitedRooms(snapshot.room.gridX, snapshot.room.gridY);
    this.clear();
    this.drawScreen(snapshot)
  }

  private updateVisitedRooms(x: number, y: number): void {
    if (x >= 0 && x < this.matrixSize && y >= 0 && y < this.matrixSize) {
      this.visitedMatrix[y][x] = 1;
    }
  }

  private clear(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private drawScreen(snapshot: GameSnapshot): void {  
    this.drawMap();   
    this.drawBullets(snapshot.bullets);
    this.drawPlayers(snapshot.players);
    this.drawEnemies(snapshot.room.enemies);
    this.drawParticles();
    this.drawMiniMap(snapshot.room.gridX, snapshot.room.gridY); 
  }

  private drawMap(): void {    
    this.context.fillStyle = 'white';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private drawMiniMap(currentGridX: number, currentGridY: number): void {
    const mapSize = 120; // Размер миникарты на экране
    const padding = 20;  // Отступ от правого верхнего угла холста
    
    const mapX = this.canvas.width - mapSize - padding;
    const mapY = padding;

    this.context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.context.fillRect(mapX, mapY, mapSize, mapSize);
    
    this.context.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.context.lineWidth = 1;
    this.context.strokeRect(mapX, mapY, mapSize, mapSize);

    const cellWidth = mapSize / this.matrixSize;
    const cellHeight = mapSize / this.matrixSize;
    const cellPadding = 2; // Зазор между комнатами

    for (let y = 0; y < this.matrixSize; y++) {
      for (let x = 0; x < this.matrixSize; x++) {
        if (this.visitedMatrix[y][x] === 1) {
          if (x === currentGridX && y === currentGridY) {
            this.context.fillStyle = '#ff5555'; // Красный цвет для текущей комнаты
          } else {
            this.context.fillStyle = '#6272a4'; // Сине-серый для ранее посещенных комнат
          }

          const roomX = mapX + x * cellWidth + cellPadding;
          const roomY = mapY + y * cellHeight + cellPadding;
          const roomW = cellWidth - cellPadding * 2;
          const roomH = cellHeight - cellPadding * 2;

          this.context.fillRect(roomX, roomY, roomW, roomH);
        }
      }
    }
  
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