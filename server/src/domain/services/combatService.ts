import Enemy from '../entities/Enemy';
import Player from '../entities/Player';
import Weapon from '../items/Weapon';
import Bullet from '../entities/Bullet';
import { IdGenerator } from '../utils/IDGenerator';

export const getDirectionToClosestEnemy = (playerX: number, playerY: number, enemies: Enemy[]): { vx: number, vy: number } => {
    if (!enemies || enemies.length === 0) {
        return { vx: 1, vy: 0 };
    }

    let closestEnemy = null;
    let minDistance = Infinity;

    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        const dx = enemy.x - playerX;
        const dy = enemy.y - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
            minDistance = distance;
            closestEnemy = enemy;
        }
    }

    if (!closestEnemy) return { vx: 1, vy: 0 };

    const dx = closestEnemy.x - playerX;
    const dy = closestEnemy.y - playerY;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len === 0) return { vx: 1, vy: 0 };
    return { vx: dx / len, vy: dy / len };
};

export const createProjectile = (
    owner: Player | Enemy,
    weapon: Weapon,
    dirX: number,
    dirY: number,
    currentTime: number
): Bullet | null => {
    if (!weapon.canFire(currentTime)) {
        return null;
    }

    const prefix = owner.type === 'player' ? 'bullet' : 'bullet_enemy';
    const projectileId = IdGenerator.generateId(prefix);

    const projectile = weapon.fire(
        projectileId,
        owner.type as 'player' | 'enemy',
        owner.id,
        owner.x,
        owner.y,
        dirX,
        dirY,
        currentTime
    );

    if (projectile) {
        projectile.currentRoomX = owner.currentRoomX;
        projectile.currentRoomY = owner.currentRoomY;
    }
    
    return projectile;
};