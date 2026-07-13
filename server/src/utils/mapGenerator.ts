import { RoomState, RoomType, VectorXY } from '../../../shared/gameTypes';

export class MapGenerator {
  private readonly matrixSize: number = 5;
  private grid: (RoomState | null)[][]; // Двумерная матрица этажа. Нужна генератору для быстрой проверки: «а пуста ли соседняя клетка?»
  private roomList: RoomState[]; // Плоский динамический список всех созданных комнат. Из него удобно фильтровать тупики и отдавать результат клиенту

  constructor() {
    this.roomList = [];
    this.grid = Array(this.matrixSize).fill(null).map(() => 
      Array(this.matrixSize).fill(null))
  }

  public generate(minRooms: number, maxRooms: number): (RoomState | null)[][] {
    let isSuccessful = false;

    while (!isSuccessful) {
      this.reset();
      isSuccessful = this.buildLayout(minRooms, maxRooms);
    }

    this.assignSpecialRooms();
    this.calculateDoors();

    return this.grid;
  }

  private reset(): void {
    this.roomList = [];
    this.grid = Array(this.matrixSize).fill(null).map(() => 
      Array(this.matrixSize).fill(null))
  }

  private buildLayout(minRooms: number, maxRooms: number): boolean {
    const cordX = Math.floor(this.matrixSize / 2);
    const cordY = Math.floor(this.matrixSize / 2);
    this.addRoom(cordX, cordY, 'Start');

    const queue: VectorXY[] = [{ x: cordX, y: cordY }];
    const targetCount = Math.floor(Math.random() * (maxRooms - minRooms + 1)) + minRooms;
    const directions: VectorXY[] = [
      { x: 0, y: -1 }, // Top
      { x: 0, y: 1 },  // Bottom
      { x: -1, y: 0 }, // Left
      { x: 1, y: 0 }   // Right
    ];

    while ((this.roomList.length < targetCount) && (queue.length > 0)) {
      const element = Math.floor(Math.random() * queue.length);
      const [cordXY] = queue.splice(element, 1); 
      let roomCreated = false;

      for (const move of directions) {
        const nextX = cordXY.x + move.x;
        const nextY = cordXY.y + move.y;

        if (this.canCreateRoom(nextX, nextY)) {
          this.addRoom(nextX, nextY, 'Normal');
          queue.push({ x: nextX, y: nextY });
          roomCreated = true;
          break;
        }
      }

      if (roomCreated && this.countNeighbors(cordXY.x, cordXY.y) < 3) {
        queue.push(cordXY);
      }
    }
  return this.roomList.length >= minRooms;
  }

  private canCreateRoom(x: number, y: number): boolean {
    if (x >= this.matrixSize || x < 0 || y >= this.matrixSize || y < 0) {
      return false;
    }
    if (this.grid[y][x] !== null) {
      return false;
    }
    if (this.countNeighbors(x, y) > 1) {
      return false;
    }
    return true
  }

  private countNeighbors(x: number, y: number): number {
    let counter = 0;
    const directions = [
      [0, 1], // Botton
      [0, -1], // Top
      [-1, 0], // LEft
      [1, 0] // Right
    ];

    for (const [dx, dy] of directions) {
      const checkX = x + dx;
      const checkY = y + dy;
      if (checkX >= 0 && checkX < this.matrixSize && checkY >= 0 && checkY < this.matrixSize) {
        if (this.grid[checkY][checkX] !== null) {
          counter += 1;
        }
      }
    }
    return counter;
  }

  private addRoom(x: number, y: number, type: RoomType): void {
    const center = Math.floor(this.matrixSize / 2);
    const distance = Math.abs(x - center) + Math.abs(y - center);
    const room: RoomState = {
      gridX: x,
      gridY: y,
      isClear: false,
      type: type,
      hasDoors: {
        'Top': false,
        'Bottom': false,
        'Left': false,
        'Right': false
      },
      respawnedEntity: [],
      distansToSpawn: distance
    };

    this.grid[y][x] = room;
    this.roomList.push(room)
  }

  assignSpecialRooms() {
    const deadEnds = this.roomList.filter(room => room.type !== 'Start' && this.countNeighbors(room.gridX, room.gridY) === 1);
    deadEnds.sort((a, b) => b.distansToSpawn - a.distansToSpawn);
    if (deadEnds.length > 0) deadEnds[0].type = 'Boss';
    if (deadEnds.length > 1) deadEnds[1].type = 'Treasure';
    if (deadEnds.length > 2) deadEnds[2].type = 'Shop';
  }

  calculateDoors() {
    for (const room of this.roomList) {
      const x = room.gridX; const y = room.gridY;
      if (y > 0 && this.grid[y - 1][x] !== null) room.hasDoors.Top = true;
      if (y < this.matrixSize - 1 && this.grid[y + 1][x] !== null) room.hasDoors.Bottom = true;
      if (x > 0 && this.grid[y][x - 1] !== null) room.hasDoors.Left = true;
      if (x < this.matrixSize - 1 && this.grid[y][x + 1] !== null) room.hasDoors.Right = true
    }
  }
}