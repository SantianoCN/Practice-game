import Bullet from "../entities/Bullet";
import LivingEntity from "../entities/LivingEntity";

export class CollisionEngine {
    public static processCollisions(
        bullets: Bullet[], 
        players: LivingEntity[], 
        enemies: LivingEntity[],
        widthRoom: number, 
        heightRoom: number,
        hasDoors: { Top: boolean, Bottom: boolean, Left: boolean, Right: boolean },
        areDoorsOpen: boolean
    ): void {
        const entities = players.concat(enemies);
    
        for (const entity of entities) {
            this.collisionEntity(entity, heightRoom, widthRoom, hasDoors, areDoorsOpen);
        }
    
        for (const bullet of bullets) {
            if (bullet.isDestroyed) continue;
            if (this.collisionBullet(bullet, heightRoom, widthRoom)) continue;
    
            for (const entity of entities) {
                if (entity.hp <= 0) continue;
                if (bullet.ownerType === entity.type) continue;
                if (this.checkBulletHit(bullet, entity)) break;
            }
        }
    }
    
    private static checkBulletHit(bullet: Bullet, target: LivingEntity): boolean {
        const bulletBounds = bullet.getBounds();
        const targetBounds = target.getBounds();
        if (bulletBounds.top > targetBounds.top && bulletBounds.top < targetBounds.bottom) {
            if (bulletBounds.right > targetBounds.left && bulletBounds.left < targetBounds.right) {
                target.takeDamage(bullet.damage);
                bullet.destroy();
                return true;
            }
        }
        return false;
    }
    
    private static collisionBullet(bullet: Bullet, height: number, width: number): boolean {
        if (bullet.x < 0 || bullet.x > width || bullet.y < 0 || bullet.y > height) {
            bullet.destroy();
            return true;
        }
        return false;
    }
    
    private static collisionEntity(
        entity: LivingEntity, 
        height: number, 
        width: number,
        hasDoors: { Top: boolean, Bottom: boolean, Left: boolean, Right: boolean },
        areDoorsOpen: boolean
    ): void {
        const entityBound = entity.getBounds();
        const doorSize = 100; // Ширина проема двери на Canvas
        const isPlayer = entity.type === 'player';

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
    }
}