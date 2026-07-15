import { RoomState } from '../../../../shared/gameTypes';
import { BulletEntity } from '../../domain/entities/BulletEntity';
import { PlayerEntity } from '../../domain/entities/PlayerEntity';
import { EnemyEntity } from '../../domain/entities/EnemyEntity';
import { TextureRenderer, EntityRenderer, BoxRenderer } from './SupportRenderer';

import warriorImgUrl from './Assets/Warrior.png'; 
import mageImgUrl from './Assets/Mage.png'; 

interface MapCell {
  state: 'unseen' | 'visible' | 'visited';
  type?: 'Start' | 'Normal' | 'Boss' | 'Treasure' | 'Shop';
}

export class CanvasRenderer {
  private context: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement; 
  private visitedMatrix: MapCell[][] = [];
  private readonly matrixSize = 10;

  // Словари фабрик отрисовщиков
  private playerRenderers: Record<string, EntityRenderer>;
  private enemyRenderers: Record<string, EntityRenderer>;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Cannot get 2D context')
    }
    this.initVisitedMatrix()
    this.context = ctx;

    // Регистрация отрисовщиков для ИГРОКОВ по полю `sprite`
    this.playerRenderers = {
      'Warrior': new TextureRenderer(warriorImgUrl), // Подключаем локальную текстуру Воина
      'green_box': new TextureRenderer(warriorImgUrl),
      'Mage': new TextureRenderer(mageImgUrl)
    };

    // Регистрация отрисовщиков для ВРАГОВ по полю `sprite`
    this.enemyRenderers = {
      'red_box': new BoxRenderer('red'),
      'orange_box': new BoxRenderer('orange')
    };
  }

  public render(
    playersMap: Map<string, PlayerEntity>, 
    enemiesMap: Map<string, EnemyEntity>, 
    bulletsMap: Map<string, BulletEntity>,
    room: RoomState | null
  ): void {
    this.clear();
    this.drawScreen(playersMap, enemiesMap, bulletsMap, room);
    if (!room) return;
    this.updateVisitedRooms(room);
  }

  public reset(): void {
    this.initVisitedMatrix();
  }

  private initVisitedMatrix(): void {
    this.visitedMatrix = Array(this.matrixSize).fill(null).map(() => 
      Array(this.matrixSize).fill(null).map(() => ({ state: 'unseen', type: undefined }))
    );
  }

  private updateVisitedRooms(room: RoomState): void {
    const x = room.gridX;
    const y = room.gridY;
    if (x < 0 || x >= this.matrixSize || y < 0 || y >= this.matrixSize) return;

    this.visitedMatrix[y][x] = {
      state: 'visited',
      type: room.type
    };

    if (room.hasDoors.Top && y > 0) {
      if (this.visitedMatrix[y - 1][x].state === 'unseen') {
        this.visitedMatrix[y - 1][x] = { state: 'visible' };
      }
    }
    if (room.hasDoors.Bottom && y < this.matrixSize - 1) {
      if (this.visitedMatrix[y + 1][x].state === 'unseen') {
        this.visitedMatrix[y + 1][x] = { state: 'visible' };
      }
    }
    if (room.hasDoors.Left && x > 0) {
      if (this.visitedMatrix[y][x - 1].state === 'unseen') {
        this.visitedMatrix[y][x - 1] = { state: 'visible' };
      }
    }
    if (room.hasDoors.Right && x < this.matrixSize - 1) {
      if (this.visitedMatrix[y][x + 1].state === 'unseen') {
        this.visitedMatrix[y][x + 1] = { state: 'visible' };
      }
    }
  }

  private clear(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private drawScreen(
    playersMap: Map<string, PlayerEntity>, 
    enemiesMap: Map<string, EnemyEntity>, 
    bulletsMap: Map<string, BulletEntity>,
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
    const mapSize = 130;
    const padding = 20;   
    
    const mapX = this.canvas.width - mapSize - padding;
    const mapY = padding;

    this.context.fillStyle = 'rgba(44, 62, 80, 0.85)';
    this.context.fillRect(mapX, mapY, mapSize, mapSize);
    
    this.context.strokeStyle = 'rgba(230, 126, 34, 0.4)';
    this.context.lineWidth = 2;
    this.context.strokeRect(mapX, mapY, mapSize, mapSize);

    const cellWidth = mapSize / this.matrixSize;
    const cellHeight = mapSize / this.matrixSize;
    const cellPadding = 1.5;

    for (let y = 0; y < this.matrixSize; y++) {
      for (let x = 0; x < this.matrixSize; x++) {
        const cell = this.visitedMatrix[y][x];
        
        if (cell.state === 'unseen') continue;

        const roomX = mapX + x * cellWidth + cellPadding;
        const roomY = mapY + y * cellHeight + cellPadding;
        const roomW = cellWidth - cellPadding * 2;
        const roomH = cellHeight - cellPadding * 2;

        if (cell.state === 'visited') {
          let cellColor = '#95a5a6'; // Обычная комната (серебряная)
          if (cell.type === 'Start') cellColor = '#2ecc71';    // Зеленая стартовая
          if (cell.type === 'Boss') cellColor = '#e74c3c';     // Красная босс-комната
          if (cell.type === 'Treasure') cellColor = '#f1c40f'; // Золотая сокровищница
          if (cell.type === 'Shop') cellColor = '#3498db';     // Синий магазин

          this.context.fillStyle = cellColor;
          this.context.fillRect(roomX, roomY, roomW, roomH);

          if (x === currentGridX && y === currentGridY) {
            this.context.fillStyle = '#ffffff';
            const markerSize = roomW / 2;
            this.context.fillRect(
              roomX + roomW / 2 - markerSize / 2, 
              roomY + roomH / 2 - markerSize / 2, 
              markerSize, 
              markerSize
            );
          }
        } else if (cell.state === 'visible') {
          this.context.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          this.context.lineWidth = 1;
          this.context.strokeRect(roomX, roomY, roomW, roomH);
        }
      }
    }
  }

  private drawBullets(bulletsMap: Map<string, BulletEntity>): void {
    bulletsMap.forEach(bullet => {
      let bulletColor = 'black';
      switch (bullet.sprite) {
        case 'red_ball':
          bulletColor = 'red';
          break
        case 'blue_ball':
          bulletColor = 'blue';
          break
        default:
          bulletColor = 'black'
      }
      
      this.context.save();
      this.context.beginPath();
      
      // Рисуем окружность с центром в renderX/renderY. Радиус равен половине ширины bullet.width
      const radius = bullet.width / 2;
      this.context.arc(bullet.renderX, bullet.renderY, radius, 0, Math.PI * 2);
      
      // Добавляем красивый неоновый эффект свечения магии
      this.context.shadowBlur = 8;
      this.context.shadowColor = bulletColor;
      
      this.context.fillStyle = bulletColor;
      this.context.fill();
      
      this.context.restore(); 
    });
  }
  
  private drawPlayers(playersMap: Map<string, PlayerEntity>): void {
    playersMap.forEach(player => {
      const renderer = this.playerRenderers[player.sprite];

      if (renderer) {
        renderer.draw(this.context, player);
      } else {
        this.drawFallback(player);
      }
    });
  }

  private drawEnemies(enemiesMap: Map<string, EnemyEntity>): void {
    enemiesMap.forEach(enemy => {
      const renderer = this.enemyRenderers[enemy.sprite];

      if (renderer) {
        renderer.draw(this.context, enemy);
      } else {
        this.drawFallback(enemy);
      }
    });
  }

  private drawFallback(entity: any): void {
    this.context.fillStyle = '#ff00ff';
    this.context.fillRect(
      entity.renderX - entity.width / 2, 
      entity.renderY - entity.height / 2, 
      entity.width, 
      entity.height
    );
  }

  private drawParticles(): void {
  }
}