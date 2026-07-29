import { Player } from '../entities/Player';
import { Room } from '../entities/Room';
import { Bullet } from '../entities/Bullet';
import { CollisionEngine } from '../physics/CollisionEngine';

export class PlayerCombatService {
    public static handleAttack(
        player: Player,
        room: Room,
        currentTime: number,
        generateBulletId: () => string
    ): Bullet | null {
        if (!player.heldKeys.attack) return null;

        const weapon = player.getActiveWeapon();
        if (!weapon.canFire(currentTime, player.mana)) return null;

        let dirX = player.lastDirX;
        let dirY = player.lastDirY;
        if (dirX === 0 && dirY === 0) {
            dirX = 1;
        }

        const aliveEnemies = room.enemies.filter(e => !e.isDead());

        if (aliveEnemies.length > 0) {
            const obstacleGrid = room.getObstacleGrid();

            const visibleEnemies = aliveEnemies.filter(enemy => 
                CollisionEngine.hasLineOfSight(player.x, player.y, enemy.x, enemy.y, obstacleGrid)
            );

            if (visibleEnemies.length > 0) {
                const target = visibleEnemies.reduce((prev, curr) => {
                    const dPrev = Math.hypot(prev.x - player.x, prev.y - player.y);
                    const dCurr = Math.hypot(curr.x - player.x, curr.y - player.y);
                    return dCurr < dPrev ? curr : prev;
                });

                const dist = Math.hypot(target.x - player.x, target.y - player.y);
                if (dist > 0) {
                    dirX = (target.x - player.x) / dist;
                    dirY = (target.y - player.y) / dist;
                }
            }
        }

        const bulletId = generateBulletId();
        const bullet = weapon.fire(
            bulletId, 
            player.id, 
            'player', 
            player.x, 
            player.y, 
            player.mana, 
            dirX, 
            dirY, 
            currentTime
        );

        if (bullet) {
            player.mana -= weapon.config.manaCost;
            player.isAttacking = true;
            return bullet;
        }

        return null;
    }
}