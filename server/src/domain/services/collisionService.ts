import Bullet from "../entities/Bullet";
import LivingEntity from "../entities/LivingEntity";
import { BaseNetworkEntity } from "../../../../shared/gameTypes";
import { IdGenerator } from "../utils/IDGenerator";
import { Obstacle } from "../entities/Obstacle";
import { Chest } from '../entities/Chest'
import MoveableEntity from '../entities/MoveableEntity'

const checkBulletHit = (bullet: Bullet, target: LivingEntity): boolean => {
    const bulletBounds = bullet.getBounds();
    const targetBounds = target.getBounds();

    if (
        bulletBounds.left < targetBounds.right &&
        bulletBounds.right > targetBounds.left &&
        bulletBounds.top < targetBounds.bottom &&
        bulletBounds.bottom > targetBounds.top
    ) {
        target.takeDamage(bullet.damage);
        bullet.destroy();
        return true;
    }
    
    return false;
};

const collisionBullet = (bullet: Bullet, obstacles: BaseNetworkEntity[], height: number, width: number): boolean => {
    if (bullet.x < 0 || bullet.x > width || bullet.y < 0 || bullet.y > height) {
        bullet.destroy();
        return true;
    }

    for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];
        if (bullet.x + bullet.width / 2 > obstacle.x && bullet.x < obstacle.x + obstacle.width
            && bullet.y + bullet.height / 2 > obstacle.y && bullet.y < obstacle.y + obstacle.height
        ) {
            bullet.destroy();
            return true;
        }
    }
    return false;
};

const takeItem = (entity: LivingEntity, droppedItems: BaseNetworkEntity[]): void => {
    if (entity.type === 'player') {
        for (let j = 0; j < droppedItems.length; j++) {
            const item = droppedItems[j];
            if (entity.x + entity.width / 2 > item.x && entity.x - 10 < item.x + item.width + 10
                && entity.y + entity.height / 2 > item.y && entity.y - 10 < item.y + item.height + 10
            ) {
                droppedItems = droppedItems.splice(j, 1);
                console.log('[CollisionManager] удален лут');
            }
        }
    }
};

const collisionChests = (
        entity: MoveableEntity,
        chests: Chest[],
        droppedItems: BaseNetworkEntity[],
        cellSize: number
    ): void => {
    const entityBound = entity.getBounds();

    for (const chest of chests) {
        if (chest.isOpened) continue;
        const chLeft = chest.gridX * cellSize;
        const chRight = chest.gridX * cellSize + cellSize;
        const chTop = chest.gridY * cellSize;
        const chBottom = chest.gridY * cellSize + cellSize;

        if (entityBound.right > chLeft && entityBound.left < chRight) {
            if ((entityBound.top > chTop && entityBound.top < chBottom)
                || (entityBound.bottom < chBottom) && (entityBound.bottom > chTop)) {
                for (const item of chest.loot) {
                    const id = IdGenerator.generateId('item');
                    const x = (chest.gridX - 1) * cellSize;
                    const y = chTop + 20;
                    const height = cellSize / 2;
                    const width = height;

                    droppedItems.push({ id, x, y, width, height, sprite: 'blue' });
                    chest.isOpened = true;
                    console.log('[CollisionEngine] Открыт сундук, дроп: ' + item.type);
                }
            }
        }

        if (entityBound.bottom > chTop && entityBound.top < chBottom) {
            if ((entityBound.left > chLeft && entityBound.left < chRight)
                || (entityBound.right < chRight) && (entityBound.right > chLeft)) {
                for (const item of chest.loot) {
                    const id = IdGenerator.generateId('item');
                    const x = (chest.gridX - 1) * cellSize;
                    const y = chTop + 20;
                    const height = cellSize / 2;
                    const width = height;
                    droppedItems.push({ id, x, y, width, height, sprite: 'blue' });
                    chest.isOpened = true;
                    console.log('[CollisionEngine] Открыт сундук, дроп: ' + item.type);
                }
            }
        }
    }
}

const collisionEntity = (
    entity: LivingEntity, 
    height: number, 
    width: number,
    hasDoors: { Top: boolean, Bottom: boolean, Left: boolean, Right: boolean },
    obstacles: { x: number, y: number, width: number, height: number }[],
    chests: Chest[],
    areDoorsOpen: boolean
): void => {
    const entityBound = entity.getBounds();
    const doorSize = 100; // Ширина проема двери на Canvas
    const isPlayer = entity.type === 'player';

    for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];
        const obLeft = obstacle.x - obstacle.width / 2;
        const obRight = obstacle.x + obstacle.width / 2;
        const obTop = obstacle.y - obstacle.height / 2;
        const obBottom = obstacle.y + obstacle.height / 2;

        if (entityBound.right > obLeft && entityBound.left < obRight) {
            if ((entityBound.top > obTop && entityBound.top < obBottom)
                || (entityBound.bottom < obBottom) && (entityBound.bottom > obTop)) {
                if (entityBound.left < obLeft) {
                    entity.x = entity.x - 1;
                } else
                    entity.x = entity.x + 1;
                entity.vx = 0;
            }
        }

        if (entityBound.bottom > obTop && entityBound.top < obBottom) {
            if ((entityBound.left > obLeft && entityBound.left < obRight)
                || (entityBound.right < obRight) && (entityBound.right > obLeft)) {
                if (entityBound.top < obTop) {
                    entity.y = entity.y - 1;
                } else
                    entity.y = entity.y + 1;
                entity.vy = 0;
            }
        }
    }

    if (entityBound.left < 0) {
        const inDoorway = entity.y > (height / 2 - doorSize / 2) && entity.y < (height / 2 + doorSize / 2);
        if (isPlayer && hasDoors.Left && areDoorsOpen && inDoorway) {
            // Разрешаем выйти за экран — переход обработает GameEngine
        } else {
            entity.vx = 0;
            entity.x = entity.width / 2;
        }
    }

    if (entityBound.right > width) {
        const inDoorway = entity.y > (height / 2 - doorSize / 2) && entity.y < (height / 2 + doorSize / 2);
        if (isPlayer && hasDoors.Right && areDoorsOpen && inDoorway) {
            // Разрешаем выйти за экран
        } else {
            entity.vx = 0;
            entity.x = width - entity.width / 2;
        }
    }

    if (entityBound.top < 0) {
        // Игрок может пройти только если есть верхняя дверь, она открыта и игрок идет ровно по центру ширины
        const inDoorway = entity.x > (width / 2 - doorSize / 2) && entity.x < (width / 2 + doorSize / 2);
        if (isPlayer && hasDoors.Top && areDoorsOpen && inDoorway) {
            // Разрешаем выйти за экран
        } else {
            entity.vy = 0;
            entity.y = entity.height / 2;
        }
    }

    if (entityBound.bottom > height) {
        const inDoorway = entity.x > (width / 2 - doorSize / 2) && entity.x < (width / 2 + doorSize / 2);
        if (isPlayer && hasDoors.Bottom && areDoorsOpen && inDoorway) {
            // Разрешаем выйти за экран
        } else {
            entity.vy = 0;
            entity.y = height - entity.height / 2;
        }
    }
};



export const processCollisions = (
    bullets: Bullet[],
    players: LivingEntity[],
    enemies: LivingEntity[],
    widthRoom: number,
    heightRoom: number,
    hasDoors: { Top: boolean, Bottom: boolean, Left: boolean, Right: boolean },
    obstacles: BaseNetworkEntity[],
    chests: Chest[],
    droppedItems: BaseNetworkEntity[],
    areDoorsOpen: boolean
): void => {
    const entities = players.concat(enemies);

        for (const entity of entities) {
            collisionEntity(
                entity,
                heightRoom,
                widthRoom,
                hasDoors,
                obstacles,
                chests,
                areDoorsOpen
            );
            collisionChests(
                entity,
                chests,
                droppedItems,
                20 //CELL_SIZE
            );
            takeItem(entity, droppedItems);
        }

        for (const bullet of bullets) {
            if (bullet.isDestroyed) continue;
            if (collisionBullet(bullet, obstacles, heightRoom, widthRoom)) continue;

            for (const entity of entities) {
                if (entity.hp <= 0) continue;
                if (bullet.ownerType === entity.type) continue;
                if (checkBulletHit(bullet, entity)) break;
            }
        }
    };