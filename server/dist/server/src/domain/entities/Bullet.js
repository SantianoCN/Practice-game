"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bullet = void 0;
const BaseEntities_1 = require("./BaseEntities");
class Bullet extends BaseEntities_1.MoveableEntity {
    ownerId;
    ownerType;
    distanceTraveled = 0;
    isDestroyed = false;
    damage;
    range;
    constructor(id, ownerId, ownerType, x, y, dirX, dirY, config) {
        super(id, x, y, config.radius, config.radius, config.speed, config.visualId);
        this.ownerId = ownerId;
        this.ownerType = ownerType;
        this.vx = dirX;
        this.vy = dirY;
        this.damage = config.damage;
        this.range = config.range;
    }
    updatePosition(deltaTime) {
        if (this.isDestroyed)
            return;
        const prevX = this.x;
        const prevY = this.y;
        super.updatePosition(deltaTime);
        this.distanceTraveled += Math.hypot(this.x - prevX, this.y - prevY);
        if (this.distanceTraveled >= this.range) {
            this.isDestroyed = true;
        }
    }
}
exports.Bullet = Bullet;
