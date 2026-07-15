import Player from '../entities/Player';
import { PlayerAction } from '../../../../shared/gameTypes';
import { ServerRoomState } from '../engines/GameEngine';
import { MATRIX_SIZE } from '../utils/mapGenerator';

// Обработка инпута ходьбы
export const applyPlayerMovementInput = (player: Player, input: PlayerAction): void => {
    let vx = 0;
    let vy = 0;
    if (input.keys?.up) vy = -1;
    if (input.keys?.down) vy = 1;
    if (input.keys?.left) vx = -1;
    if (input.keys?.right) vx = 1;

    player.setDirection(vx, vy);
};

// Логика перехода между комнатами вынесена из движка
export const checkAndApplyRoomTransition = (
    player: Player,
    allPlayers: Map<string, Player>,
    floorMap: (ServerRoomState | null)[][],
    roomWidth: number,
    roomHeight: number,
    padding: number
): void => {
    const rx = player.currentRoomX;
    const ry = player.currentRoomY;
    const room = floorMap[ry][rx];
    if (!room) return;

    if (room.enemies.length > 0) return;

    let nextX = rx;
    let nextY = ry;
    let spawnX = player.x;
    let spawnY = player.y;
    let isTransition = false;

    if (player.y < padding && room.hasDoors.Top) {
        nextY -= 1;
        spawnY = roomHeight - player.height / 2;
        isTransition = true;
    } else if (player.y > roomHeight - padding && room.hasDoors.Bottom) {
        nextY += 1;
        spawnY = player.height / 2;
        isTransition = true;
    } else if (player.x < padding && room.hasDoors.Left) {
        nextX -= 1;
        spawnX = roomWidth - player.width / 2;
        isTransition = true;
    } else if (player.x > roomWidth - padding && room.hasDoors.Right) {
        nextX += 1;
        spawnX = player.width / 2;
        isTransition = true;
    }

    if (isTransition) {
        if (nextX >= 0 && nextX < MATRIX_SIZE && 
            nextY >= 0 && nextY < MATRIX_SIZE && 
            floorMap[nextY][nextX] !== null) {
            
            player.currentRoomX = nextX;
            player.currentRoomY = nextY;
            player.x = spawnX;
            player.y = spawnY;
            player.vx = 0; 
            player.vy = 0;
            
            if (floorMap[nextY][nextX]?.type === 'Normal' && !floorMap[nextY][nextX]?.isClear) {
                allPlayers.forEach((p) => {
                    p.currentRoomX = nextX;
                    p.currentRoomY = nextY;
                    p.x = spawnX;
                    p.y = spawnY;
                    p.vx = 0; 
                    p.vy = 0;
                });
            }
            console.log(`[GameRoom] Игрок ${player.name} перешел в комнату [${nextX}, ${nextY}]`);
        }
    }
};