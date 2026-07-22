"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollisionEngine = void 0;
const SpatialGrid_1 = require("./SpatialGrid");
class CollisionEngine {
    static isOverlapping(a, b) {
        return (a.left < b.right &&
            a.right > b.left &&
            a.top < b.bottom &&
            a.bottom > b.top);
    }
    static resolveWallBounds(entity, roomWidth, roomHeight, room, isPlayer) {
        const bounds = entity.getBounds();
        const doorSize = 100;
        const isDoorOpen = room.isClear || room.enemies.length === 0;
        if (bounds.left < 0) {
            const inDoorway = entity.y > (roomHeight / 2 - doorSize / 2) && entity.y < (roomHeight / 2 + doorSize / 2);
            if (!(isPlayer && room.hasDoors.Left && isDoorOpen && inDoorway)) {
                entity.x = entity.width / 2;
                entity.vx = 0;
            }
        }
        if (bounds.right > roomWidth) {
            const inDoorway = entity.y > (roomHeight / 2 - doorSize / 2) && entity.y < (roomHeight / 2 + doorSize / 2);
            if (!(isPlayer && room.hasDoors.Right && isDoorOpen && inDoorway)) {
                entity.x = roomWidth - entity.width / 2;
                entity.vx = 0;
            }
        }
        if (bounds.top < 0) {
            const inDoorway = entity.x > (roomWidth / 2 - doorSize / 2) && entity.x < (roomWidth / 2 + doorSize / 2);
            if (!(isPlayer && room.hasDoors.Top && isDoorOpen && inDoorway)) {
                entity.vy = 0;
                entity.y = entity.height / 2;
            }
        }
        if (bounds.bottom > roomHeight) {
            const inDoorway = entity.x > (roomWidth / 2 - doorSize / 2) && entity.x < (roomWidth / 2 + doorSize / 2);
            if (!(isPlayer && room.hasDoors.Bottom && isDoorOpen && inDoorway)) {
                entity.vy = 0;
                entity.y = roomHeight - entity.height / 2;
            }
        }
    }
    static resolveObstacles(entity, obstacleGrid) {
        const eBounds = entity.getBounds();
        const potentialObstacles = obstacleGrid.query(eBounds);
        for (const obs of potentialObstacles) {
            const oBounds = obs.getBounds();
            if (this.isOverlapping(eBounds, oBounds)) {
                const overlapLeft = eBounds.right - oBounds.left;
                const overlapRight = oBounds.right - eBounds.left;
                const overlapTop = eBounds.bottom - oBounds.top;
                const overlapBottom = oBounds.bottom - eBounds.top;
                const minX = Math.min(overlapLeft, overlapRight);
                const minY = Math.min(overlapTop, overlapBottom);
                let resolveX = false;
                let resolveY = false;
                if (entity.vx === 0 && entity.vy === 0) {
                    if (minX < minY)
                        resolveX = true;
                    else
                        resolveY = true;
                }
                else if (entity.vx === 0) {
                    resolveY = true;
                }
                else if (entity.vy === 0) {
                    resolveX = true;
                }
                else {
                    const tx = minX / Math.abs(entity.vx);
                    const ty = minY / Math.abs(entity.vy);
                    if (tx < ty)
                        resolveX = true;
                    else
                        resolveY = true;
                }
                if (resolveX) {
                    entity.x += (overlapLeft < overlapRight) ? -overlapLeft : overlapRight;
                    entity.vx = 0;
                }
                else if (resolveY) {
                    entity.y += (overlapTop < overlapBottom) ? -overlapTop : overlapBottom;
                    entity.vy = 0;
                }
                eBounds.left = entity.x - entity.width / 2;
                eBounds.right = entity.x + entity.width / 2;
                eBounds.top = entity.y - entity.height / 2;
                eBounds.bottom = entity.y + entity.height / 2;
            }
        }
    }
    static resolveBullets(bullets, targets) {
        if (bullets.length === 0 || targets.length === 0)
            return;
        const targetGrid = new SpatialGrid_1.SpatialGrid(100);
        for (const target of targets) {
            if (!target.isDead()) {
                targetGrid.insert(target);
            }
        }
        for (const bullet of bullets) {
            if (bullet.isDestroyed)
                continue;
            const bBounds = bullet.getBounds();
            const potentialTargets = targetGrid.query(bBounds);
            for (const target of potentialTargets) {
                if (bullet.ownerType === target.entityType)
                    continue;
                if (this.isOverlapping(bBounds, target.getBounds())) {
                    target.takeDamage(bullet.damage);
                    bullet.isDestroyed = true;
                    break;
                }
            }
        }
    }
    static resolveBulletEnvironment(bullets, obstacleGrid, roomWidth, roomHeight) {
        if (bullets.length === 0)
            return;
        for (const bullet of bullets) {
            if (bullet.isDestroyed)
                continue;
            const bBounds = bullet.getBounds();
            if (bBounds.left <= 0 ||
                bBounds.right >= roomWidth ||
                bBounds.top <= 0 ||
                bBounds.bottom >= roomHeight) {
                bullet.isDestroyed = true;
                continue;
            }
            const potentialObstacles = obstacleGrid.query(bBounds);
            for (const obs of potentialObstacles) {
                if (this.isOverlapping(bBounds, obs.getBounds())) {
                    bullet.isDestroyed = true;
                    break;
                }
            }
        }
    }
    static checkChestInteraction(player, chests) {
        const playerBounds = player.getBounds();
        for (const chest of chests) {
            if (chest.isOpened)
                continue;
            if (this.isOverlapping(playerBounds, chest.getBounds())) {
                if (player.isInteracting) {
                    player.isInteracting = false;
                    return chest.id;
                }
            }
        }
        return null;
    }
    static resolveLootPickup(player, droppedItems) {
        const playerBounds = player.getBounds();
        const collected = [];
        for (let i = droppedItems.length - 1; i >= 0; i--) {
            const item = droppedItems[i];
            if (this.isOverlapping(playerBounds, item.getBounds())) {
                const hasWeaponEquip = item.onPickup.some(effect => effect.type === 'equip_weapon');
                if (hasWeaponEquip) {
                    if (!player.isInteracting)
                        continue;
                    player.isInteracting = false;
                }
                collected.push(item);
                droppedItems.splice(i, 1);
            }
        }
        return collected;
    }
}
exports.CollisionEngine = CollisionEngine;
