import { LivingEntity, MoveableEntity } from '../entities/BaseEntities';
import { Obstacle } from '../entities/Obstacle';
import { Bullet } from '../entities/Bullet';
import { Room } from '../entities/Room';
import { Chest, DroppedItem } from '../entities/Chest';
import { Player } from '../entities/Player';
import { BoundingBox, IDGenerator } from '@game/shared';

export class CollisionEngine {
    
    public static isOverlapping(a: BoundingBox, b: BoundingBox): boolean {
        return (
            a.left < b.right &&
            a.right > b.left &&
            a.top < b.bottom &&
            a.bottom > b.top
        );
    }

    public static resolveWallBounds(
        entity: MoveableEntity, 
        roomWidth: number, 
        roomHeight: number, 
        room: Room,
        isPlayer: boolean
    ): void {
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

    public static resolveObstacles(entity: MoveableEntity, obstacles: Obstacle[]): void {
        const eBounds = entity.getBounds();

        for (const obs of obstacles) {
            const oBounds = obs.getBounds();

            if (this.isOverlapping(eBounds, oBounds)) {
                const overlapLeft = eBounds.right - oBounds.left;
                const overlapRight = oBounds.right - eBounds.left;
                const overlapTop = eBounds.bottom - oBounds.top;
                const overlapBottom = oBounds.bottom - eBounds.top;

                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

                if (minOverlap === overlapLeft) {
                    entity.x -= overlapLeft;
                    entity.vx = 0;
                } else if (minOverlap === overlapRight) {
                    entity.x += overlapRight;
                    entity.vx = 0;
                } else if (minOverlap === overlapTop) {
                    entity.y -= overlapTop;
                    entity.vy = 0;
                } else if (minOverlap === overlapBottom) {
                    entity.y += overlapBottom;
                    entity.vy = 0;
                }

                eBounds.left = entity.x - entity.width / 2;
                eBounds.right = entity.x + entity.width / 2;
                eBounds.top = entity.y - entity.height / 2;
                eBounds.bottom = entity.y + entity.height / 2;
            }
        }
    }
    public static resolveBullets(bullets: Bullet[], targets: LivingEntity[]): void {
        for (const bullet of bullets) {
            if (bullet.isDestroyed) continue;
            const bBounds = bullet.getBounds();

            for (const target of targets) {
                if (target.isDead()) continue;
                if (bullet.ownerType === target.entityType) continue;

                if (this.isOverlapping(bBounds, target.getBounds())) {
                    target.takeDamage(bullet.damage);
                    bullet.isDestroyed = true;
                    break;
                }
            }
        }
    }

    public static resolveBulletEnvironment(
        bullets: Bullet[], 
        obstacles: Obstacle[], 
        roomWidth: number, 
        roomHeight: number
    ): void {
        for (const bullet of bullets) {
            if (bullet.isDestroyed) continue;

            const bBounds = bullet.getBounds();

            if (
                bBounds.left <= 0 || 
                bBounds.right >= roomWidth || 
                bBounds.top <= 0 || 
                bBounds.bottom >= roomHeight
            ) {
                bullet.isDestroyed = true;
                continue;
            }

            for (const obs of obstacles) {
                if (this.isOverlapping(bBounds, obs.getBounds())) {
                    bullet.isDestroyed = true;
                    break;
                }
            }
        }
    }

    public static resolveChests(
        player: MoveableEntity, 
        chests: Chest[], 
        droppedItems: DroppedItem[],
        cellSize: number,
        idGen: IDGenerator
    ): void {
        const pBounds = player.getBounds();

        for (const chest of chests) {
            if (chest.isOpened) continue;
            
            const chLeft = chest.gridX * cellSize;
            const chRight = chest.gridX * cellSize + cellSize;
            const chTop = chest.gridY * cellSize;
            const chBottom = chest.gridY * cellSize + cellSize;

            if (pBounds.right > chLeft && pBounds.left < chRight && 
                pBounds.bottom > chTop && pBounds.top < chBottom) {
                
                for (const item of chest.loot) {
                    const id = idGen('item');
                    const x = (chest.gridX - 1) * cellSize;
                    const y = chTop + 20;
                    droppedItems.push(new DroppedItem(id, x, y, 10, 10, 'blue', item));
                }
                
                chest.isOpened = true;
            }
        }
    }

    public static resolveLootPickup(
        player: Player, 
        droppedItems: DroppedItem[]
    ): void {
        const pBounds = player.getBounds();
        
        for (let i = droppedItems.length - 1; i >= 0; i--) {
            const item = droppedItems[i];
            
            if (player.x + player.width / 2 > item.x && player.x - 10 < item.x + item.width + 10 &&
                player.y + player.height / 2 > item.y && player.y - 10 < item.y + item.height + 10) {
                switch(item.content.type) {
                    case 'gold':
                        player.addGold(item.content.amount);
                        break;
                    case 'weapon': {
                        const dropped = player.addWeaponToInventory(item.content.weapon);
                        if (dropped) {
                            droppedItems.push({
                                id: dropped.id,
                                x: item.x + player.width,
                                y: item.y,
                                width: item.width,
                                height: item.height,
                                visualId: dropped.config.visualId,
                                content: {
                                    type: 'weapon',
                                    weapon:  dropped 
                                }
                            });
                        }
                        break;  
                    }
                }
                droppedItems.splice(i, 1);
            }
        }
    }
}