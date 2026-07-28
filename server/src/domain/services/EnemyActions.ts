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
) => boolean;

function getAttackRange(enemy: Enemy): number {
    return enemy.currentWeapon ? enemy.currentWeapon.config.projectile.range : 50;
}


function moveToward(
    enemy: Enemy, targetX: number, targetY: number,
    room: Room, roomWidth: number, roomHeight: number
): boolean {
    const path = EnemyPathFinder.findPath(enemy.x, enemy.y, targetX, targetY, room.obstacles, roomWidth, roomHeight);
    if (path.length === 0) { 
        //console.log('путь не найден');
        enemy.vx = 0;
        enemy.vy = 0;
        return true; 
    }
    const next = path[0];
    enemy.vx = next.x - enemy.x;
    enemy.vy = next.y - enemy.y;
    return false;
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
    const hasLOS = EnemyPathFinder.hasLineOfSight(enemy.x, enemy.y, target.x, target.y, roomWidth, roomHeight, room.obstacles);

    if (dist <= attackRange && hasLOS) {
        enemy.vx = 0; enemy.vy = 0;
        return tryFire(enemy, target, generateId, room, currentTime, attackRange);
    }
    return moveToward(enemy, target.x, target.y, room, roomWidth, roomHeight);
};

export const kite: ActionFn = (enemy, target, generateId, room, roomWidth, roomHeight, currentTime) => {
    const attackRange = getAttackRange(enemy);
    if (attackRange < 60) 
        return engage(
            enemy, 
            target,
            generateId, 
            room, 
            roomWidth, 
            roomHeight, 
            currentTime
        ); 

    const dist = Math.hypot(target.x - enemy.x, target.y - enemy.y);
    const ideal = attackRange * 0.85;
    const hasLOS = EnemyPathFinder.hasLineOfSight(
        enemy.x, 
        enemy.y, 
        target.x, 
        target.y, 
        roomWidth, 
        roomHeight, 
        room.obstacles
    );

    if (hasLOS && Math.abs(dist - ideal) < attackRange * 0.5) {
        enemy.vx = 0; enemy.vy = 0;
        return tryFire(enemy, target, generateId, room, currentTime, attackRange);
    }
    if (dist < ideal) {
        const awayX = enemy.x + (enemy.x - target.x);
        const awayY = enemy.y + (enemy.y - target.y);
        return moveToward(enemy, awayX, awayY, room, roomWidth, roomHeight);
    } else {
        return moveToward(enemy, target.x, target.y, room, roomWidth, roomHeight);
    }
};

export const flank: ActionFn = (enemy, target, generateId, room, roomWidth, roomHeight, currentTime) => {
    const dx = target.x - enemy.x, dy = target.y - enemy.y;
    const flankX = target.x - dy * 0.6;
    const flankY = target.y + dx * 0.6; 

    const distToFlank = Math.hypot(flankX - enemy.x, flankY - enemy.y);
    if (distToFlank < 20) {
        enemy.vx = 0; enemy.vy = 0;
        return true; // дальше пусть решает MCTS
    }
    return moveToward(enemy, flankX, flankY, room, roomWidth, roomHeight);
};

export const retreat: ActionFn = (enemy, target, generateId, room, roomWidth, roomHeight, currentTime) => {
    const dx = enemy.x - target.x, dy = enemy.y - target.y;
    const dist = Math.hypot(dx, dy) || 1;

    let awayX = enemy.x + (dx / dist) * getAttackRange(enemy) * 1.5;
    let awayY = enemy.y + (dy / dist) * getAttackRange(enemy) * 1.5;
    if (getAttackRange(enemy) > 80) {
        awayX = enemy.x + (dx / dist) * getAttackRange(enemy);
        awayY = enemy.y + (dy / dist) * getAttackRange(enemy);
    } 

    const distToGoal = Math.hypot(awayX - enemy.x, awayY - enemy.y);
    if (distToGoal < 20) {
        enemy.vx = 0; enemy.vy = 0;
        return true;
    }
    return moveToward(enemy, awayX, awayY, room, roomWidth, roomHeight);
};

export const wait: ActionFn = (enemy, target, generateId, room, roomWidth, roomHeight, currentTime) => {
    return engage(
            enemy, 
            target,
            generateId, 
            room, 
            roomWidth, 
            roomHeight, 
            currentTime
        ); 
    enemy.vx = 0; enemy.vy = 0;
    const attackRange = getAttackRange(enemy);
    const dist = Math.hypot(target.x - enemy.x, target.y - enemy.y);
    if (dist <= attackRange && EnemyPathFinder.hasLineOfSight(enemy.x, enemy.y, target.x, target.y, roomWidth, roomHeight, room.obstacles)) {
        tryFire(enemy, target, generateId, room, currentTime, attackRange);
    }
    return true;
};