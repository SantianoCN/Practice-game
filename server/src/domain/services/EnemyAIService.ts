import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';

export class EnemyAIService {
    public static updateEnemies(enemies: Enemy[], players: Player[]): void {
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
                continue;
            }

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

            // Движение в зависимости от состояния
            if (enemy.aiState === 'chase') {
                if (distance > 0) {
                    enemy.vx = dx / distance;
                    enemy.vy = dy / distance;
                } else {
                    enemy.vx = 0;
                    enemy.vy = 0;
                }
            } else if (enemy.aiState === 'attack') {
                // При атаке враг останавливается, чтобы прицелиться
                enemy.vx = 0;
                enemy.vy = 0;
            }
        }
    }
}