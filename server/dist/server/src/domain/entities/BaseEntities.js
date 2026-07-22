"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LivingEntity = exports.MoveableEntity = exports.StaticEntity = void 0;
class StaticEntity {
    id;
    x;
    y;
    width;
    height;
    visualId;
    constructor(id, x, y, width, height, visualId) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.visualId = visualId;
    }
    getBounds() {
        return {
            left: this.x - this.width / 2,
            right: this.x + this.width / 2,
            top: this.y - this.height / 2,
            bottom: this.y + this.height / 2
        };
    }
}
exports.StaticEntity = StaticEntity;
class MoveableEntity {
    id;
    x;
    y;
    width;
    height;
    speed;
    visualId;
    constructor(id, x, y, width, height, speed, visualId) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.visualId = visualId;
    }
    vx = 0;
    vy = 0;
    updatePosition(deltaTime) {
        const length = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (length > 0) {
            this.x += (this.vx / length) * this.speed * deltaTime;
            this.y += (this.vy / length) * this.speed * deltaTime;
        }
    }
    getBounds() {
        return {
            left: this.x - this.width / 2,
            right: this.x + this.width / 2,
            top: this.y - this.height / 2,
            bottom: this.y + this.height / 2
        };
    }
}
exports.MoveableEntity = MoveableEntity;
class LivingEntity extends MoveableEntity {
    maxHp;
    hp;
    archetype;
    isInvulnerable = false;
    invulnTimer = 0;
    static INVULN_DURATION = 0.5;
    constructor(id, x, y, width, height, speed, visualId, maxHp, hp = maxHp, archetype) {
        super(id, x, y, width, height, speed, visualId);
        this.maxHp = maxHp;
        this.hp = hp;
        this.archetype = archetype;
    }
    updateEntity(deltaTime) {
        this.updatePosition(deltaTime);
        if (this.isInvulnerable) {
            this.invulnTimer -= deltaTime;
            if (this.invulnTimer <= 0)
                this.isInvulnerable = false;
        }
    }
    takeDamage(amount) {
        if (this.isInvulnerable || this.hp <= 0)
            return false;
        this.hp = Math.max(0, this.hp - amount);
        this.isInvulnerable = true;
        this.invulnTimer = LivingEntity.INVULN_DURATION;
        return true;
    }
    isDead() {
        return this.hp <= 0;
    }
}
exports.LivingEntity = LivingEntity;
