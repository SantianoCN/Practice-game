import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Room } from '../entities/Room';
import EnemyPathFinder from './EnemyPathFinder';

export type GenerateIdFn = (prefix: string) => string;

export type ActionFn = (
    enemy: Enemy,
    target: Player,
    generateId: GenerateIdFn,
    room: Room,
    roomWidth: number,
    roomHeight: number,
    currentTime: number
) => boolean; // true — действие завершено, пора спрашивать MCTS заново

function getAttackRange(enemy: Enemy): number {
    return enemy.currentWeapon ? enemy.currentWeapon.config.projectile.range : 50;
}

// Ставит НАПРАВЛЕНИЕ (не позицию) — MoveableEntity.updatePosition сам
// нормализует вектор и умножит на speed*deltaTime. Здесь только vx/vy,
// как и в реальном плавном движении (аналог integrate_movement из C++,
// только сама интеграция уже живёт в Enemy.updateEntity).
function moveToward(
    enemy: Enemy, targetX: number, targetY: number,
    room: Room, roomWidth: number, roomHeight: number
): void {
    const path = EnemyPathFinder.findPath(enemy.x, enemy.y, targetX, targetY, room.obstacles, roomWidth, roomHeight);
    if (path.length === 0) { enemy.vx = 0; enemy.vy = 0; return; }
    const next = path[0];
    enemy.vx = next.x - enemy.x;
    enemy.vy = next.y - enemy.y;
}

function tryFire(
    enemy: Enemy, target: Player, generateId: GenerateIdFn,
    room: Room, currentTime: number, attackRange: number
): boolean {
    const dx = target.x - enemy.x, dy = target.y - enemy.y;
    const dist = Math.hypot(dx, dy);
    if (dist === 0 || dist > attackRange) return false;
    const bullet = enemy.currentWeapon.fire(
        generateId('bullet'), enemy.id, 'enemy',
        enemy.x, enemy.y, Infinity, dx / dist, dy / dist, currentTime
    );
    if (bullet) { room.bullets.push(bullet); return true; }
    return false; // на кулдауне — попробуем ещё раз в следующий тик, действие не завершено
}

export const engage: ActionFn = (enemy, target, generateId, room, roomWidth, roomHeight, currentTime) => {
    const attackRange = getAttackRange(enemy);
    const dist = Math.hypot(target.x - enemy.x, target.y - enemy.y);
    const hasLOS = EnemyPathFinder.hasLineOfSight(enemy.x, enemy.y, target.x, target.y, room.obstacles);

    if (dist <= attackRange && hasLOS) {
        enemy.vx = 0; enemy.vy = 0;
        return tryFire(enemy, target, generateId, room, currentTime, attackRange);
    }
    moveToward(enemy, target.x, target.y, room, roomWidth, roomHeight);
    return false;
};

export const kite: ActionFn = (enemy, target, generateId, room, roomWidth, roomHeight, currentTime) => {
    const attackRange = getAttackRange(enemy);
    const dist = Math.hypot(target.x - enemy.x, target.y - enemy.y);
    const ideal = attackRange * 0.85;
    const hasLOS = EnemyPathFinder.hasLineOfSight(enemy.x, enemy.y, target.x, target.y, room.obstacles);

    if (hasLOS && Math.abs(dist - ideal) < attackRange * 0.1) {
        enemy.vx = 0; enemy.vy = 0;
        return tryFire(enemy, target, generateId, room, currentTime, attackRange);
    }
    if (dist < ideal) {
        const awayX = enemy.x + (enemy.x - target.x);
        const awayY = enemy.y + (enemy.y - target.y);
        moveToward(enemy, awayX, awayY, room, roomWidth, roomHeight);
    } else {
        moveToward(enemy, target.x, target.y, room, roomWidth, roomHeight);
    }
    return false;
};

export const flank: ActionFn = (enemy, target, generateId, room, roomWidth, roomHeight, currentTime) => {
    const dx = target.x - enemy.x, dy = target.y - enemy.y;
    const flankX = target.x - dy * 0.6;   // детерминированный перпендикуляр,
    const flankY = target.y + dx * 0.6;   // не случайный угол — см. пояснение выше

    const distToFlank = Math.hypot(flankX - enemy.x, flankY - enemy.y);
    if (distToFlank < 20) {
        enemy.vx = 0; enemy.vy = 0;
        return true; // дошли до точки — дальше пусть решает MCTS
    }
    moveToward(enemy, flankX, flankY, room, roomWidth, roomHeight);
    return false;
};

export const retreat: ActionFn = (enemy, target, generateId, room, roomWidth, roomHeight, currentTime) => {
    const dx = enemy.x - target.x, dy = enemy.y - target.y;
    const dist = Math.hypot(dx, dy) || 1;
    const awayX = enemy.x + (dx / dist) * getAttackRange(enemy) * 1.5;
    const awayY = enemy.y + (dy / dist) * getAttackRange(enemy) * 1.5;

    const distToGoal = Math.hypot(awayX - enemy.x, awayY - enemy.y);
    if (distToGoal < 20) {
        enemy.vx = 0; enemy.vy = 0;
        return true;
    }
    moveToward(enemy, awayX, awayY, room, roomWidth, roomHeight);
    return false;
};

export const wait: ActionFn = (enemy, target, generateId, room, roomWidth, roomHeight, currentTime) => {
    enemy.vx = 0; enemy.vy = 0;
    const attackRange = getAttackRange(enemy);
    const dist = Math.hypot(target.x - enemy.x, target.y - enemy.y);
    if (dist <= attackRange && EnemyPathFinder.hasLineOfSight(enemy.x, enemy.y, target.x, target.y, room.obstacles)) {
        tryFire(enemy, target, generateId, room, currentTime, attackRange);
    }
    return true; // Wait — короткое, завершается сразу, независимо от выстрела
};