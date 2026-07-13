import { ClientPlayer, ClientEnemy, ClientBullet } from '../entities/ClientEntities';
import { RoomState } from '../../../shared/gameTypes';

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
    this.initVisitedMatrix()
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
    if (!room) return;
    this.updateVisitedRooms(room.gridX, room.gridY);
  }

  private initVisitedMatrix(): void {
    this.visitedMatrix = Array(this.matrixSize).fill(null).map(() => 
      Array(this.matrixSize).fill(0))
  }

  private updateVisitedRooms(x: number, y: number): void {
    if (x >= 0 && x < this.matrixSize && y >= 0 && y < this.matrixSize) {
      this.visitedMatrix[y][x] = 1;
    }
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
    if (!room) return;
    this.drawMiniMap(room.gridX, room.gridY); 
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