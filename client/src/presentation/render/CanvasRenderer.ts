import { BaseNetworkEntity, RoomState } from '../../../../shared/gameTypes';
import { BulletEntity } from '../../domain/entities/BulletEntity';
import { PlayerEntity } from '../../domain/entities/PlayerEntity';
import { EnemyEntity } from '../../domain/entities/EnemyEntity';
import { ServerRoomState } from '../../../../server/src/domain/utils/mapGenerator';
import { Chest } from '../../../../server/src/domain/entities/Chest';
import { DroppedItems } from '../../../../server/src/domain/engines/CollisionEngine';

interface MapCell {
  state: 'unseen' | 'visible' | 'visited';
  type?: 'Start' | 'Normal' | 'Boss' | 'Treasure' | 'Shop';
}

export class CanvasRenderer {
  private context: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private visitedMatrix: MapCell[][] = [];
  private readonly matrixSize = 10;

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
    playersMap: Map<string, PlayerEntity>,
    enemiesMap: Map<string, EnemyEntity>,
    bulletsMap: Map<string, BulletEntity>,
    room: ServerRoomState | null
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

  private updateVisitedRooms(room: ServerRoomState): void {
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
    room: ServerRoomState | null
  ): void {
    this.drawMap(room);
    this.drawObstacles(room?.obstacles ?? []);
    if (room?.chests)
      this.drawChests(room.chests);
    if (room?.droppedItems)
      this.drawDroppedItems(room.droppedItems);
    this.drawBullets(bulletsMap);
    this.drawPlayers(playersMap);
    this.drawEnemies(enemiesMap);
    this.drawParticles();
    if (!room) return;
    this.drawMiniMap(room.gridX, room.gridY);
  }

  private drawMap(room: ServerRoomState | null): void {
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
      this.context.fillStyle = 'black';

      this.context.fillRect(
        bullet.renderX - bullet.width / 2,
        bullet.renderY - bullet.height / 2,
        bullet.width,
        bullet.height
      );
    });
  }

  private drawPlayers(playersMap: Map<string, PlayerEntity>): void {
    playersMap.forEach(player => {
      switch (player.sprite) {
        case 'green_box':
          this.context.fillStyle = 'green';
          break;
        case 'blue_box':
          this.context.fillStyle = 'blue';
      }

      this.context.fillRect(
        player.renderX - player.width / 2,
        player.renderY - player.height / 2,
        player.width,
        player.height
      );
    });
  }

  private drawEnemies(enemiesMap: Map<string, EnemyEntity>): void {
    enemiesMap.forEach(enemy => {
      switch (enemy.sprite) {
        case 'red_box':
          this.context.fillStyle = 'red';
          break;
        case 'orange_box':
          this.context.fillStyle = 'orange';
      }

      this.context.fillRect(
        enemy.renderX - enemy.width / 2,
        enemy.renderY - enemy.height / 2,
        enemy.width,
        enemy.height
      );
    });
  }

  // CanvasRenderer.ts
  private drawObstacles(obstacles: BaseNetworkEntity[]): void {
    for (const obstacle of obstacles) {
      this.context.fillStyle = 'black'; // или спрайт через obstacle.sprite при наличии текстур
      this.context.fillRect(
        obstacle.x - obstacle.width / 2,
        obstacle.y - obstacle.height / 2,
        obstacle.width,
        obstacle.height
      );
    }
  }

  private drawChests(chests: Chest[]): void {
    if (!chests || chests.length === 0) return;

    const cellSize = 20; // размер ячейки

    for (const chest of chests) {
      // Вычисляем позицию в пикселях
      const x = chest.gridX * cellSize;
      const y = chest.gridY * cellSize;
      const w = cellSize;
      const h = cellSize;

      // Проверяем, открыт ли сундук
      const isOpened = chest.isOpened || false;

      // === Тень ===
      this.context.shadowColor = 'rgba(0, 0, 0, 0.25)';
      this.context.shadowBlur = 8;
      this.context.shadowOffsetX = 2;
      this.context.shadowOffsetY = 2;

      // === Основная часть ===
      const bodyColor = isOpened ? '#8B7D3C' : '#E67E22';
      this.context.fillStyle = bodyColor;
      this.context.fillRect(x, y, w, h);

      // Убираем тень для деталей
      this.context.shadowColor = 'transparent';
      this.context.shadowBlur = 0;
      this.context.shadowOffsetX = 0;
      this.context.shadowOffsetY = 0;

      // === Контур ===
      this.context.strokeStyle = isOpened ? '#5C4A2A' : '#8B5A00';
      this.context.lineWidth = 1;
      this.context.strokeRect(x, y, w, h);

      // === Деревянные доски (текстура) ===
      this.context.strokeStyle = isOpened ? '#7A6B3A' : '#CC7A00';
      this.context.lineWidth = 0.5;

      // Горизонтальные линии (доски)
      for (let i = 1; i < 3; i++) {
        const lineY = y + (h * i) / 3;
        this.context.beginPath();
        this.context.moveTo(x + 2, lineY);
        this.context.lineTo(x + w - 2, lineY);
        this.context.stroke();
      }

      // Вертикальная линия посередине (стык досок)
      this.context.beginPath();
      this.context.moveTo(x + w / 2, y + 2);
      this.context.lineTo(x + w / 2, y + h - 2);
      this.context.stroke();

      // === Крышка ===
      if (!isOpened) {
        // Крышка закрытого сундука
        this.context.fillStyle = '#D35400';

        // Верхняя часть крышки (треугольник)
        this.context.beginPath();
        this.context.moveTo(x + 2, y);
        this.context.lineTo(x + w / 2, y - 3);
        this.context.lineTo(x + w - 2, y);
        this.context.closePath();
        this.context.fill();
        this.context.strokeStyle = '#8B5A00';
        this.context.lineWidth = 0.8;
        this.context.stroke();

        // Петли крышки
        this.context.fillStyle = '#DAA520';
        this.context.fillRect(x + 3, y - 1, 2, 2);
        this.context.fillRect(x + w - 5, y - 1, 2, 2);

        // Замок
        this.context.fillStyle = '#F1C40F';
        // Основа замка
        this.context.fillRect(x + w / 2 - 3, y + h / 2 - 3, 6, 5);
        // Дужка замка
        this.context.fillStyle = '#DAA520';
        this.context.fillRect(x + w / 2 - 1, y + h / 2 - 5, 2, 3);
        // Скважина
        this.context.fillStyle = '#4A3520';
        this.context.fillRect(x + w / 2 - 1, y + h / 2 - 1, 2, 1);
      } else {
        // Открытая крышка (откинута назад)
        this.context.fillStyle = '#6B5D2C';
        this.context.beginPath();
        this.context.moveTo(x + 2, y - 1);
        this.context.lineTo(x + w / 2, y - 5);
        this.context.lineTo(x + w - 2, y - 1);
        this.context.closePath();
        this.context.fill();
        this.context.strokeStyle = '#4A3520';
        this.context.lineWidth = 0.8;
        this.context.stroke();

        // Внутренность сундука
        this.context.fillStyle = '#3D2B1F';
        this.context.fillRect(x + 2, y + 2, w - 4, h - 4);

        // Свечение от предметов внутри
        this.context.fillStyle = 'rgba(255, 215, 0, 0.15)';
        this.context.fillRect(x + 3, y + 3, w - 6, h - 6);

        // Открытый замок (висит сбоку)
        this.context.fillStyle = '#8B7D3C';
        this.context.fillRect(x + w - 4, y + h / 2 - 2, 3, 3);
        // Цепь
        this.context.fillStyle = '#A0926B';
        this.context.fillRect(x + w - 2, y + h / 2 - 1, 1, 5);
      }

      // === Индикатор предметов ===
      if (chest.loot && chest.loot.length > 0 && !isOpened) {
        // Маленькая точка, показывающая что есть loot
        this.context.fillStyle = 'rgba(255, 215, 0, 0.8)';
        this.context.beginPath();
        this.context.arc(x + w / 2, y - 4, 2, 0, Math.PI * 2);
        this.context.fill();
      }
    }
  }

  private drawDroppedItems(droppedItems: BaseNetworkEntity[]): void {
    if (!droppedItems || droppedItems.length === 0) return;

    for (const item of droppedItems) {
        const x = item.x - item.width / 2;
        const y = item.y - item.height / 2;
        const w = item.width;
        const h = item.height;

        // === Тень ===
        this.context.shadowColor = 'rgba(0, 0, 0, 0.2)';
        this.context.shadowBlur = 5;
        this.context.shadowOffsetX = 1;
        this.context.shadowOffsetY = 2;

        // === Цвет из sprite ===
        let color = '#95A5A6';
        let glowColor = 'rgba(0, 0, 0, 0)';

        switch (item.sprite) {
            case 'sword':
            case 'weapon':
                color = '#E74C3C';
                glowColor = 'rgba(231, 76, 60, 0.2)';
                break;
            case 'gold':
                color = '#F1C40F';
                glowColor = 'rgba(241, 196, 15, 0.2)';
                break;
            case 'mana':
                color = '#3498DB';
                glowColor = 'rgba(52, 152, 219, 0.2)';
                break;
            case 'potion':
                color = '#2ECC71';
                glowColor = 'rgba(46, 204, 113, 0.2)';
                break;
            case 'shield':
                color = '#1ABC9C';
                glowColor = 'rgba(26, 188, 156, 0.2)';
                break;
            case 'bow':
            case 'arrow':
                color = '#27AE60';
                glowColor = 'rgba(39, 174, 96, 0.2)';
                break;
            case 'ring':
            case 'amulet':
                color = '#9B59B6';
                glowColor = 'rgba(155, 89, 182, 0.2)';
                break;
            case 'armor':
            case 'helmet':
                color = '#5D6D7E';
                glowColor = 'rgba(93, 109, 126, 0.2)';
                break;
            default:
                color = '#95A5A6';
                glowColor = 'rgba(149, 165, 166, 0.2)';
        }

        // === Свечение ===
        if (glowColor !== 'rgba(0, 0, 0, 0)') {
            this.context.fillStyle = glowColor;
            this.context.beginPath();
            this.context.arc(item.x, item.y, Math.max(w, h) * 1.2, 0, Math.PI * 2);
            this.context.fill();
        }

        // === Основной квадрат ===
        this.context.fillStyle = color;
        this.context.fillRect(x, y, w, h);

        // Убираем тень для деталей
        this.context.shadowColor = 'transparent';
        this.context.shadowBlur = 0;
        this.context.shadowOffsetX = 0;
        this.context.shadowOffsetY = 0;

        // === Обводка ===
        this.context.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.context.lineWidth = 1;
        this.context.strokeRect(x, y, w, h);

        // === Блик ===
        this.context.fillStyle = 'rgba(255, 255, 255, 0.15)';
        this.context.fillRect(x + 2, y + 1, w / 3, 2);
    }
}
 
  private drawParticles(): void {

  }
}