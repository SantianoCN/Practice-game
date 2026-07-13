import Bullet from "../entities/Bullet";
import LivingEntity from "../entities/LivingEntity";

export class CollisionEngine {
    public static processCollisions(
        bullets: Bullet[], 
        players: LivingEntity[], 
        enemies: LivingEntity[],
        widthRoom: number, 
        heightRoom: number
    ): void {
        const entities = players.concat(enemies);
    
        for (const entity of entities) {
            this.collisionEntity(entity, heightRoom, widthRoom);
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
        if (bulletBounds.top > targetBounds.top
            && bulletBounds.top < targetBounds.bottom) {
            if (bulletBounds.right > targetBounds.left
                && bulletBounds.left < targetBounds.right) {
                target.takeDamage(bullet.damage);
                bullet.destroy();
                return true;
            }
        }
        return false;
    }
    
    private static collisionBullet(bullet: Bullet, height: number, width: number): boolean {
        if (bullet.x < 0 || bullet.x > width
            || bullet.y < 0 || bullet.y > height) {
            bullet.destroy();
            return true;
        }
        return false;
    }
    
    private static collisionEntity(
        entity: LivingEntity, 
        height: number, 
        width: number
    ): void {
        const entityBound = entity.getBounds();
        if (entityBound.left < 0) {
            entity.vx = 0;
            entity.x = entity.width / 2;
        }
        if (entityBound.right > width) {
            entity.vx = 0;
            entity.x = width - entity.width / 2;
        }
        if (entityBound.top < 0) {
            entity.vy = 0;
            entity.y = entity.height / 2;
        }
        if (entityBound.bottom > height) {
            entity.vy = 0;
            entity.y = height - entity.height / 2;
        }
    }
}