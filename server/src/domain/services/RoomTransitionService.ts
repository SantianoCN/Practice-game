import { Player } from "../entities/Player";
import { Room } from "../entities/Room";
import { GAME_CONFIG } from "@game/shared";

export class RoomTransitionService {
    public static handleTransition(
        player: Player,
        allPlayers: Player[],
        floorMap: (Room | null)[][],
        roomWidth: number,
        roomHeight: number
    ): void {
        const room = this.getRoom(floorMap, player.roomX, player.roomY);
        if (!room || room.enemies.length > 0) return;

        let nextX = player.roomX;
        let nextY = player.roomY;
        let spawnX = player.x;
        let spawnY = player.y;
        let isTransition = false;
        
        const bounds = player.getBounds();

        if (
            bounds.top < GAME_CONFIG.DOOR_PADDING && 
            bounds.left < roomWidth / 2 + GAME_CONFIG.DOOR_SIZE / 2 && 
            bounds.right > roomWidth / 2 - GAME_CONFIG.DOOR_SIZE / 2 && 
            room.hasDoors.Top
        ) {
            nextY -= 1; 
            spawnY = roomHeight - player.height / 2 - GAME_CONFIG.DOOR_PADDING; 
            isTransition = true;
        } else if (
            bounds.bottom > roomHeight - GAME_CONFIG.DOOR_PADDING && 
            bounds.left < roomWidth / 2 + GAME_CONFIG.DOOR_SIZE / 2 && 
            bounds.right > roomWidth / 2 - GAME_CONFIG.DOOR_SIZE / 2 && 
            room.hasDoors.Bottom
        ) {
            nextY += 1; 
            spawnY = player.height / 2 + GAME_CONFIG.DOOR_PADDING; 
            isTransition = true;
        } else if (
            bounds.left < GAME_CONFIG.DOOR_PADDING && 
            bounds.bottom > roomHeight / 2 - GAME_CONFIG.DOOR_SIZE / 2 &&
            bounds.top < roomHeight / 2 + GAME_CONFIG.DOOR_SIZE / 2 &&
            room.hasDoors.Left
        ) {
            nextX -= 1; 
            spawnX = roomWidth - player.width / 2 - GAME_CONFIG.DOOR_PADDING; 
            isTransition = true;
        } else if (
            bounds.right > roomWidth - GAME_CONFIG.DOOR_PADDING && 
            bounds.bottom > roomHeight / 2 - GAME_CONFIG.DOOR_SIZE / 2 &&
            bounds.top < roomHeight / 2 + GAME_CONFIG.DOOR_SIZE / 2 &&
            room.hasDoors.Right
        ) {
            nextX += 1; 
            spawnX = player.width / 2 + GAME_CONFIG.DOOR_PADDING; 
            isTransition = true;
        }

        if (isTransition) {
            const nextRoom = this.getRoom(floorMap, nextX, nextY);
            
            if (nextRoom !== null) {
                player.roomX = nextX;
                player.roomY = nextY;
                player.x = spawnX;
                player.y = spawnY;
                player.vx = 0;
                player.vy = 0;

                if (nextRoom.type === 'Normal' && !nextRoom.isClear) {
                    for (const p of allPlayers) {
                        if (p.id !== player.id && !p.isDead()) {
                            p.roomX = nextX;
                            p.roomY = nextY;
                            const offsetX = (Math.random() - 0.5) * 40; 
                            const offsetY = (Math.random() - 0.5) * 40;
                            p.x = spawnX + offsetX;
                            p.y = spawnY + offsetY;
                            p.vx = 0; 
                            p.vy = 0;
                        }
                    }
                }
            }
        }
    }

    private static getRoom(floorMap: (Room | null)[][], x: number, y: number): Room | null {
        if (y < 0 || y >= floorMap.length) return null;
        if (x < 0 || x >= floorMap[y].length) return null;
        return floorMap[y][x];
    }
}