import { RoomState as SharedRoomState, RoomType, VectorXY } from '../../../../shared/gameTypes';
import Enemy from '../entities/Enemy';
import { GAME_CONFIG } from '../../config/gameConfig';
import { WARRIOR_PRESET_LIZARD } from '../../config/enemyPresets';
import { IdGenerator } from '../utils/IDGenerator';
import { STAFF } from '../../config/weaponPresets';
import Weapon from '../items/Weapon';

export const MATRIX_SIZE = 10;

export interface ServerRoomState extends Omit<SharedRoomState, 'enemies'> {
    enemies: Enemy[];
}

interface MapState {
    grid: (ServerRoomState | null)[][];
    roomList: ServerRoomState[];
}

const countNeighbors = (grid: (ServerRoomState | null)[][], x: number, y: number): number => {
    let counter = 0;
    const directions = [[0, 1], [0, -1], [-1, 0], [1, 0]];

    for (const [dx, dy] of directions) {
        const checkX = x + dx;
        const checkY = y + dy;
        if (checkX >= 0 && checkX < MATRIX_SIZE && checkY >= 0 && checkY < MATRIX_SIZE) {
            if (grid[checkY][checkX] !== null) counter += 1;
        }
    }
    return counter;
};

const canCreateRoom = (grid: (ServerRoomState | null)[][], x: number, y: number): boolean => {
    if (x >= MATRIX_SIZE || x < 0 || y >= MATRIX_SIZE || y < 0) return false;
    if (grid[y][x] !== null) return false;
    if (countNeighbors(grid, x, y) > 1) return false;
    return true;
};

const addRoom = (state: MapState, x: number, y: number, type: RoomType): void => {
    const center = Math.floor(MATRIX_SIZE / 2);
    const distance = Math.abs(x - center) + Math.abs(y - center);
    const room: ServerRoomState = {
        gridX: x,
        gridY: y,
        isClear: false,
        type: type,
        hasDoors: { Top: false, Bottom: false, Left: false, Right: false },
        respawnedEntities: [],
        distanceToSpawn: distance,
        enemies: []
    };

    state.grid[y][x] = room;
    state.roomList.push(room);
};

const buildLayout = (state: MapState, minRooms: number, maxRooms: number): boolean => {
    const cordX = Math.floor(MATRIX_SIZE / 2);
    const cordY = Math.floor(MATRIX_SIZE / 2);
    addRoom(state, cordX, cordY, 'Start');

    const queue: VectorXY[] = [{ x: cordX, y: cordY }];
    const targetCount = Math.floor(Math.random() * (maxRooms - minRooms + 1)) + minRooms;
    const directions: VectorXY[] = [
        { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
    ];

    while ((state.roomList.length < targetCount) && (queue.length > 0)) {
        const element = Math.floor(Math.random() * queue.length);
        const [cordXY] = queue.splice(element, 1); 
        let roomCreated = false;

        for (const move of directions) {
            const nextX = cordXY.x + move.x;
            const nextY = cordXY.y + move.y;

            if (canCreateRoom(state.grid, nextX, nextY)) {
                addRoom(state, nextX, nextY, 'Normal');
                queue.push({ x: nextX, y: nextY });
                roomCreated = true;
                break;
            }
        }

        if (roomCreated && countNeighbors(state.grid, cordXY.x, cordXY.y) < 3) {
            queue.push(cordXY);
        }
    }
    return state.roomList.length >= minRooms;
};

const assignSpecialRooms = (roomList: ServerRoomState[], grid: (ServerRoomState | null)[][]) => {
    const deadEnds = roomList.filter(room => room.type !== 'Start' && countNeighbors(grid, room.gridX, room.gridY) === 1);
    deadEnds.sort((a, b) => b.distanceToSpawn - a.distanceToSpawn);
    if (deadEnds.length > 0) deadEnds[0].type = 'Boss';
    if (deadEnds.length > 1) deadEnds[1].type = 'Treasure';
    if (deadEnds.length > 2) deadEnds[2].type = 'Shop';
};

const calculateDoors = (roomList: ServerRoomState[], grid: (ServerRoomState | null)[][]) => {
    for (const room of roomList) {
        const x = room.gridX; const y = room.gridY;
        if (y > 0 && grid[y - 1][x] !== null) room.hasDoors.Top = true;
        if (y < MATRIX_SIZE - 1 && grid[y + 1][x] !== null) room.hasDoors.Bottom = true;
        if (x > 0 && grid[y][x - 1] !== null) room.hasDoors.Left = true;
        if (x < MATRIX_SIZE - 1 && grid[y][x + 1] !== null) room.hasDoors.Right = true;
    }
};

const populateDungeonWithEnemies = (roomList: ServerRoomState[]) => {
  for (let i = 0; i < roomList.length; i++) {
    const room = roomList[i];
    
    if (room && room.type === 'Normal') {
      const enemyCount = GAME_CONFIG.MIN_ENEMIES_PER_ROOM + Math.floor(Math.random() * (GAME_CONFIG.MAX_ENEMIES_PER_ROOM - GAME_CONFIG.MIN_ENEMIES_PER_ROOM + 1));
      
      for (let i = 0; i < enemyCount; i++) {
          const enemyId = IdGenerator.generateId('lizard');
          const padding = GAME_CONFIG.SPAWN_PADDING;
          const randomX = padding + Math.random() * (GAME_CONFIG.ROOM_WIDTH - padding * 2);
          const randomY = padding + Math.random() * (GAME_CONFIG.ROOM_HEIGHT - padding * 2);
          const lizardBite = new Weapon(`bite_${enemyId}`, "Укус завра", STAFF);
          const newLizard = new Enemy(
              enemyId,
              randomX,
              randomY,
              WARRIOR_PRESET_LIZARD,
              lizardBite
          );

          room.enemies.push(newLizard);
      }
    }
  }
  
  console.log(`[GameEngine] Все комнаты лабиринта успешно заселены ящерами!`);
};

// --- Главная экспортируемая функция ---

export const generateMap = (minRooms: number, maxRooms: number): (ServerRoomState | null)[][] => {
    let isSuccessful = false;
    let mapState: MapState = { grid: [], roomList: [] };

    while (!isSuccessful) {
        // Сбрасываем состояние на каждой попытке
        mapState = {
            grid: Array(MATRIX_SIZE).fill(null).map(() => Array(MATRIX_SIZE).fill(null)),
            roomList: []
        };
        isSuccessful = buildLayout(mapState, minRooms, maxRooms);
    }

    assignSpecialRooms(mapState.roomList, mapState.grid);
    calculateDoors(mapState.roomList, mapState.grid);
    populateDungeonWithEnemies(mapState.roomList);

    return mapState.grid;
};