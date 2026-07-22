"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerCombatService = void 0;
class PlayerCombatService {
    static handleAttack(player, room, currentTime, generateBulletId) {
        if (!player.heldKeys.attack)
            return null;
        const weapon = player.getActiveWeapon();
        if (!weapon.canFire(currentTime, player.mana))
            return null;
        let dirX = 1;
        let dirY = 0;
        const aliveEnemies = room.enemies.filter(e => !e.isDead());
        if (aliveEnemies.length > 0) {
            const target = aliveEnemies.reduce((prev, curr) => {
                const dPrev = Math.hypot(prev.x - player.x, prev.y - player.y);
                const dCurr = Math.hypot(curr.x - player.x, curr.y - player.y);
                return dCurr < dPrev ? curr : prev;
            });
            const dist = Math.hypot(target.x - player.x, target.y - player.y);
            if (dist > 0) {
                dirX = (target.x - player.x) / dist;
                dirY = (target.y - player.y) / dist;
            }
        }
        const bulletId = generateBulletId();
        const bullet = weapon.fire(bulletId, player.id, 'player', player.x, player.y, player.mana, dirX, dirY, currentTime);
        if (bullet) {
            player.mana -= weapon.config.manaCost;
            return bullet;
        }
        return null;
    }
}
exports.PlayerCombatService = PlayerCombatService;
