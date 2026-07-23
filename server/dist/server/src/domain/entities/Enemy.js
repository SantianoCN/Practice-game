"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Enemy = void 0;
const BaseEntities_1 = require("./BaseEntities");
class Enemy extends BaseEntities_1.LivingEntity {
    currentWeapon;
    targetId = null;
    aiState = 'idle';
    entityType = 'enemy';
    constructor(id, x, y, stats, weapon) {
        super(id, x, y, stats.width, stats.height, stats.speed, stats.visualId, stats.maxHp, stats.maxHp, stats.archetype);
        this.currentWeapon = weapon;
    }
}
exports.Enemy = Enemy;
