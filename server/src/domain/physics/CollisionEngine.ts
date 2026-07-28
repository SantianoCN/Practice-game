import { LivingEntity, MoveableEntity } from '../entities/BaseEntities';
import { Obstacle } from '../entities/Obstacle';
import { Bullet } from '../entities/Bullet';
import { Room } from '../entities/Room';
import { Chest, DroppedItem } from '../entities/Chest';
import { Player } from '../entities/Player';
import { BoundingBox, GAME_CONFIG, ItemPreset } from '@game/shared';
import { SpatialGrid } from './SpatialGrid';
import { Portal } from '../entities/Portal';

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
        const doorSize = GAME_CONFIG.DOOR_SIZE; 
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

        const targetGrid = new SpatialGrid<LivingEntity>(GAME_CONFIG.GRID_SIZE);
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
                player.canInteracting = true;
                if (player.isInteracting) {
                    player.isInteracting = false;
                    player.canInteracting = false;
                    return chest.id;
                }
            }
        }
        return null;
    }

    public static resolveLootPickup(
        player: Player, 
        droppedItems: DroppedItem[],
        getItemPreset: (presetId: string) => ItemPreset | null
    ): DroppedItem[] {
        const playerBounds = player.getBounds();
        const collected: DroppedItem[] = [];
        
        for (let i = droppedItems.length - 1; i >= 0; i--) {
            const item = droppedItems[i];
            
            if (this.isOverlapping(playerBounds, item.getBounds())) {
                const preset = getItemPreset(item.presetId);
                const requiresInteraction = preset?.type !== 'gold';
                
                if (requiresInteraction) {
                    player.canInteracting = true;
                    if (!player.isInteracting) {
                        continue;
                    } 
                    player.isInteracting = false;
                    player.canInteracting = false;
                }

                collected.push(item);
                droppedItems.splice(i, 1);
            }
        }
        return collected;
    }

    public static checkPortalInteraction(player: Player, portal: Portal | null): boolean {
        if (!portal || !portal.isActive) return false;

        if (this.isOverlapping(player.getBounds(), portal.getBounds())) {
            player.canInteracting = true;
            if (player.isInteracting) {
                player.isInteracting = false;
                player.canInteracting = false;
                return true;
            }
        }
        return false;
    }

    public static resolvePlayerRevival(player: Player, deadPlayers: Player[]): Player | null {
        if (deadPlayers.length === 0) return null;
        
        const playerBounds = player.getBounds();

        for (const deadPlayer of deadPlayers) {
            if (this.isOverlapping(playerBounds, deadPlayer.getBounds())) {
                player.canInteracting = true;
                if (player.isInteracting) {
                    player.isInteracting = false;
                    player.canInteracting = false;
                    return deadPlayer;
                } 
            }
        }
        return null;
    }

    public static hasLineOfSight(
        x0: number, y0: number, 
        x1: number, y1: number, 
        obstacles: Obstacle[]
    ): boolean {
        if (obstacles.length === 0) return true;

        for (const obs of obstacles) {
            if (this.lineIntersectsAABB(x0, y0, x1, y1, obs.getBounds())) {
                return false;
            }
        }
        return true;
    }

    private static lineIntersectsAABB(
        x0: number, y0: number, 
        x1: number, y1: number, 
        box: BoundingBox
    ): boolean {
        let tmin = 0;
        let tmax = 1;

        const dx = x1 - x0;
        const dy = y1 - y0;

        if (Math.abs(dx) > 1e-8) {
            const t1 = (box.left - x0) / dx;
            const t2 = (box.right - x0) / dx;
            tmin = Math.max(tmin, Math.min(t1, t2));
            tmax = Math.min(tmax, Math.max(t1, t2));
        } else if (x0 < box.left || x0 > box.right) {
            return false;
        }

        if (Math.abs(dy) > 1e-8) {
            const t1 = (box.top - y0) / dy;
            const t2 = (box.bottom - y0) / dy;
            tmin = Math.max(tmin, Math.min(t1, t2));
            tmax = Math.min(tmax, Math.max(t1, t2));
        } else if (y0 < box.top || y0 > box.bottom) {
            return false;
        }

        return tmax >= tmin && tmax > 0 && tmin < 1;
    }
}