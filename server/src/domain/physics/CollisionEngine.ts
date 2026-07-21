import { LivingEntity, MoveableEntity } from '../entities/BaseEntities';
import { Obstacle } from '../entities/Obstacle';
import { Bullet } from '../entities/Bullet';
import { Room } from '../entities/Room';
import { Chest, DroppedItem } from '../entities/Chest';
import { Player } from '../entities/Player';
import { BoundingBox } from '@game/shared';
import { SpatialGrid } from './SpatialGrid';

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

    public static resolveObstacles(entity: MoveableEntity, obstacleGrid: SpatialGrid<Obstacle>): void {
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
                    if (minX < minY) resolveX = true; else resolveY = true;
                } else if (entity.vx === 0) {
                    resolveY = true;
                } else if (entity.vy === 0) {
                    resolveX = true;
                } else {
                    const tx = minX / Math.abs(entity.vx);
                    const ty = minY / Math.abs(entity.vy);
                    if (tx < ty) resolveX = true; else resolveY = true;
                }

                if (resolveX) {
                    entity.x += (overlapLeft < overlapRight) ? -overlapLeft : overlapRight;
                    entity.vx = 0;
                } else if (resolveY) {
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

    public static resolveBullets(bullets: Bullet[], targets: LivingEntity[]): void {
        if (bullets.length === 0 || targets.length === 0) return;

        const targetGrid = new SpatialGrid<LivingEntity>(100);
        for (const target of targets) {
            if (!target.isDead()) {
                targetGrid.insert(target);
            }
        }

        for (const bullet of bullets) {
            if (bullet.isDestroyed) continue;
            const bBounds = bullet.getBounds();
            const potentialTargets = targetGrid.query(bBounds);

            for (const target of potentialTargets) {
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
        obstacleGrid: SpatialGrid<Obstacle>,
        roomWidth: number, 
        roomHeight: number
    ): void {
        if (bullets.length === 0) return;

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

            const potentialObstacles = obstacleGrid.query(bBounds);
            for (const obs of potentialObstacles) {
                if (this.isOverlapping(bBounds, obs.getBounds())) {
                    bullet.isDestroyed = true;
                    break;
                }
            }
        }
    }

    public static checkChestInteraction(player: Player, chests: Chest[]): string | null {
        const playerBounds = player.getBounds();
        
        for (const chest of chests) {
            if (chest.isOpened) continue;
            
            if (this.isOverlapping(playerBounds, chest.getBounds())) {
                if (player.isInteracting) {
                    player.isInteracting = false; 
                    return chest.id;
                }
            }
        }
        return null;
    }

    public static resolveLootPickup(player: Player, droppedItems: DroppedItem[]): DroppedItem[] {
        const playerBounds = player.getBounds();
        const collected: DroppedItem[] = [];
        
        for (let i = droppedItems.length - 1; i >= 0; i--) {
            const item = droppedItems[i];
            
            if (this.isOverlapping(playerBounds, item.getBounds())) {
                const hasWeaponEquip = item.onPickup.some(effect => effect.type === 'equip_weapon');
                
                if (hasWeaponEquip) {
                    if (!player.isInteracting) continue;
                    player.isInteracting = false;
                }

                collected.push(item);
                droppedItems.splice(i, 1);
            }
        }

        return collected;
    }
}