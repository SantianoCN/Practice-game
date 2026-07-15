import Player from '../entities/Player';
import Bullet from '../entities/Bullet';
import { PlayerAction } from '../../../../shared/gameTypes';
import { ServerRoomState } from '../engines/GameEngine';
import { applyPlayerMovementInput } from './movementService';
import { getDirectionToClosestEnemy, createProjectile } from './combatService';

// Обрабатываем инпуты всех игроков разом
export const processAllPlayersInputs = (
    players: Map<string, Player>,
    playerInputs: Map<string, PlayerAction>,
    bullets: Bullet[],
    floorMap: (ServerRoomState | null)[][]
): void => {
    for (const [userId, input] of playerInputs.entries()) {
        const player = players.get(userId);
        if (!player) continue;

        applyPlayerMovementInput(player, input);

        if (input.keys?.attack) { 
            const activeWeapon = player.getActiveWeapon();
            const now = performance.now();
            const room = floorMap[player.currentRoomY][player.currentRoomX];
            const enemies = room ? room.enemies : [];
            const dir = getDirectionToClosestEnemy(player.x, player.y, enemies);
            
            const newBullet = createProjectile(player, activeWeapon, dir.vx, dir.vy, now);
            if (newBullet) {
                bullets.push(newBullet);
            }
        }
    }
};