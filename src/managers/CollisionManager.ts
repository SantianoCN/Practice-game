import Bullet from "src/entities/Bullet";
import LivingEntity from "src/entities/LivingEntity";


function collisionDamage(entities: LivingEntity[], bullets: Bullet[]) {
    for(let i = 0; i < entities.length; i++) {
        for (let j = 0; j < bullets.length; j++) {
            if (entities[i].getBounds().top < bullets.length) {
                
            }
        }
    }
}