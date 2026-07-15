import { RoomState } from '../../../../shared/gameTypes';
import { BulletEntity } from '../../domain/entities/BulletEntity';
import { PlayerEntity } from '../../domain/entities/PlayerEntity';
import { EnemyEntity } from '../../domain/entities/EnemyEntity';

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
    room: RoomState | null,
    myId: string
  ): void {
    this.clear();
    this.drawScreen(playersMap, enemiesMap, bulletsMap, room);
    if (!room) return;
    this.updateVisitedRooms(room);
    this.drawGUI(playersMap, myId);
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

  private drawGUI(playersMap: Map<string, PlayerEntity>, myId: string) {
    const me = playersMap.get(myId);
    if (!me) return;

    const px = me.renderX;
    const py = me.renderY;
    const r = me.width ?? 15;

    this.context.save();

    const arrowY = py - r - 16;
    this.context.fillStyle = '#d4af37';
    
    this.context.fillRect(px - 5, arrowY, 10, 3);
    this.context.fillRect(px - 3, arrowY + 3, 6, 3);
    this.context.fillRect(px - 1, arrowY + 6, 2, 3);

    this.context.restore();

    const guiX = 20;
    const guiY = 20;
    const guiWidth = 210;
    const guiHeight = 64;

    const hp = me.hp ?? 100;
    const maxHp = me.maxHp ?? 100;
    const mana = me.mana ?? 100;
    const maxMana = me.maxMana ?? 100;

    const hpRatio = Math.max(0, Math.min(1, hp / maxHp));
    const manaRatio = Math.max(0, Math.min(1, mana / maxMana));

    this.context.save();

    this.context.fillStyle = '#1c0e07';
    this.context.fillRect(guiX, guiY, guiWidth, guiHeight);

    this.context.strokeStyle = '#b8860b';
    this.context.lineWidth = 3;
    this.context.strokeRect(guiX, guiY, guiWidth, guiHeight);

    this.context.strokeStyle = '#3c2415'; 
    this.context.lineWidth = 1;
    this.context.strokeRect(guiX + 2, guiY + 2, guiWidth - 4, guiHeight - 4);

    const barX = guiX + 10;
    const barY = guiY + 8;
    const barWidth = guiWidth - 20;
    const barHeight = 16;

    this.context.fillStyle = '#380805';
    this.context.fillRect(barX, barY, barWidth, barHeight);

    const hpFillWidth = Math.floor(barWidth * hpRatio);
    this.context.fillStyle = '#8a1c14';
    this.context.fillRect(barX, barY, hpFillWidth, barHeight);

    this.context.strokeStyle = '#120904';
    this.context.lineWidth = 2;
    this.context.strokeRect(barX, barY, barWidth, barHeight);

    this.context.fillStyle = '#f3e5ab';
    this.context.font = '8px "Press Start 2P", monospace';
    this.context.fillText(`ЖИЗНЬ: ${Math.floor(hp)}/${maxHp}`, barX + 6, barY + 11);

    const manaY = barY + 22;
    const manaHeight = 12;

    this.context.fillStyle = '#0a232d';
    this.context.fillRect(barX, manaY, barWidth, manaHeight);

    const manaFillWidth = Math.floor(barWidth * manaRatio);
    this.context.fillStyle = '#1a5f7a';
    this.context.fillRect(barX, manaY, manaFillWidth, manaHeight);

    this.context.strokeStyle = '#120904';
    this.context.lineWidth = 2;
    this.context.strokeRect(barX, manaY, barWidth, manaHeight);

    this.context.fillStyle = '#8ad5f0';
    this.context.font = '7px "Press Start 2P", monospace';
    this.context.fillText(`БАЙКАЛ: ${Math.floor(mana)}/${maxMana}`, barX + 6, manaY + 9);

    this.context.restore();
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

    let floorColor = '#3c2415';
    if (room.type === 'Start') floorColor = '#4a2f1b';
    if (room.type === 'Boss') floorColor = '#3a0d0a';
    if (room.type === 'Treasure') floorColor = '#5c4314';
    if (room.type === 'Shop') floorColor = '#1e2b30';

    this.context.fillStyle = floorColor;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const doorColor = room.isClear ? '#b8860b' : '#5c120c'; 
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

    this.context.fillStyle = 'rgba(26, 15, 10, 0.95)';
    this.context.fillRect(mapX, mapY, mapSize, mapSize);
    
    this.context.strokeStyle = 'rgba(184, 134, 11, 0.7)';
    this.context.lineWidth = 3;
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
          let cellColor = '#5c3d24';
          if (cell.type === 'Start') cellColor = '#2d5a27';
          if (cell.type === 'Boss') cellColor = '#8a1c14';
          if (cell.type === 'Treasure') cellColor = '#d4af37';
          if (cell.type === 'Shop') cellColor = '#1c4966';

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

  private drawParticles(): void {
  }
}