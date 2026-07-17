import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Room } from '../entities/Room';
import { CollisionEngine } from '../physics/CollisionEngine';
import { IDGenerator } from '@game/shared';

export class EnemyAIService {
    public static updateEnemies(
        enemies: Enemy[], 
        players: Player[], 
        room: Room,
        deltaTime: number,
        currentTime: number,
        roomWidth: number,
        roomHeight: number,
        generateId: IDGenerator
    ): void {
        for (const enemy of enemies) {
            if (enemy.isDead()) {
                enemy.vx = 0;
                enemy.vy = 0;
                continue;
            }

            let closestPlayer: Player | null = null;
            let minDistance = Infinity;

            for (const player of players) {
                if (player.isDead()) continue;

                const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y);

                if (distance < minDistance) {
                    minDistance = distance;
                    closestPlayer = player;
                }
            }

            if (!closestPlayer) {
                enemy.aiState = 'idle';
                enemy.targetId = null;
                enemy.vx = 0;
                enemy.vy = 0;
            } else {
                enemy.targetId = closestPlayer.id;
                const dx = closestPlayer.x - enemy.x;
                const dy = closestPlayer.y - enemy.y;
                const distance = Math.hypot(dx, dy);

                const attackRange = enemy.currentWeapon ? (enemy.currentWeapon.config.projectile.range * 0.8) : 50;

                if (distance <= attackRange) {
                    enemy.aiState = 'attack';
                } else {
                    enemy.aiState = 'chase';
                }

                if (enemy.aiState === 'chase') {
                    if (distance > 0) {
                        enemy.vx = dx / distance;
                        enemy.vy = dy / distance;
                    }
                } else if (enemy.aiState === 'attack') {
                    enemy.vx = 0;
                    enemy.vy = 0;
                }
            }

            enemy.updateEntity(deltaTime);
            CollisionEngine.resolveWallBounds(enemy, roomWidth, roomHeight, room, false);
            CollisionEngine.resolveObstacles(enemy, room.obstacles);

            if (enemy.aiState === 'attack' && enemy.targetId && closestPlayer) {
                const dirX = closestPlayer.x - enemy.x;
                const dirY = closestPlayer.y - enemy.y;
                const dist = Math.hypot(dirX, dirY);

                if (dist > 0) {
                    const bullet = enemy.currentWeapon.fire(
                        generateId('bullet'),
                        enemy.id,
                        'enemy',
                        enemy.x,
                        enemy.y,
                        dirX / dist, 
                        dirY / dist,
                        currentTime
                    );
                    
                    if (bullet) {
                        room.bullets.push(bullet);
                    }
                }
            }
        }
    }
}