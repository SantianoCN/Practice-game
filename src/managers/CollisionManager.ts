import Bullet from "src/entities/Bullet";
import LivingEntity from "src/entities/LivingEntity";

function processCollisions(bullets: Bullet[], players: LivingEntity[], enemies: LivingEntity[],
    height: number, width: number) {
    const entities = players.concat(enemies);

    for (let i = 0; i < entities.length; i++) {
        collisionEntity(entities[i], height, width);
    }

    for (let j = 0; j < bullets.length; j++) {
        const bullet = bullets[j];
        if (bullet.isDestroyed) continue;
        if (collisionBullet(bullet, height, width)) continue;

        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            if (entity.hp <= 0) continue;
            if (bullet.ownerType === entity.type) continue;
            checkBulletHit(bullet, entity);
        }
    }
}

function checkBulletHit(bullet: Bullet, target: LivingEntity) {
    const bulletBounds = bullet.getBounds();
    const targetBounds = target.getBounds();
    if (bulletBounds.top > targetBounds.top
        && bulletBounds.top < targetBounds.bottom) {
        if (bulletBounds.right > targetBounds.left
            && bulletBounds.left < targetBounds.right) {
            target.takeDamage(bullet.damage);
            bullet.destroy();
        }
    }
}

function collisionBullet(bullet: Bullet, height: number, width: number): boolean {
    if (bullet.x < 0 || bullet.x > width
        || bullet.y < 0 || bullet.y > height) {
        bullet.destroy();
        return true;
    }
    return false;
}

function collisionEntity(entity: LivingEntity, height: number, width: number) {
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