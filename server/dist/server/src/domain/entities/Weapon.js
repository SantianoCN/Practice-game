"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Weapon = void 0;
const Bullet_1 = require("./Bullet");
class Weapon {
    id;
    presetId;
    name;
    config;
    lastFiredTime = 0;
    constructor(id, presetId, name, config) {
        this.id = id;
        this.presetId = presetId;
        this.name = name;
        this.config = config;
    }
    canFire(currentTime, ownerMana) {
        return (currentTime - this.lastFiredTime >= this.config.cooldownMs) &&
            (ownerMana - this.config.manaCost >= 0);
    }
    fire(bulletId, ownerId, ownerType, startX, startY, ownerMana, dirX, dirY, currentTime) {
        if (!this.canFire(currentTime, ownerMana))
            return null;
        this.lastFiredTime = currentTime;
        return new Bullet_1.Bullet(bulletId, ownerId, ownerType, startX, startY, dirX, dirY, this.config.projectile);
    }
}
exports.Weapon = Weapon;
