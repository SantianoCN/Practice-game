import Bullet from "src/entities/Bullet";
import LivingEntity from "src/entities/LivingEntity";

function collisionDamage(entities: LivingEntity[], bullets: Bullet[]) {
    for(let i = 0; i < entities.length; i++) {
        const target = entities[i];
        for (let j = 0; j < bullets.length; j++) {
            const bullet = bullets[j];
            if (bullet.isDestroyed) continue;
            if (target.hp <= 0) continue;
            if (bullet.ownerType === target.type) continue; 

            if (bullet.getBounds().top > target.getBounds().top
                    && bullet.getBounds().top < target.getBounds().bottom) {
                if (bullet.getBounds().right > target.getBounds().left
                    && bullet.getBounds().left < target.getBounds().right) {
                    target.takeDamage(bullet.damage);
                    bullet.destroy();
                }
            }
        }
    }
}

function collisionBorder() {

}