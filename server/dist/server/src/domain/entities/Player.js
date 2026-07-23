"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const BaseEntities_1 = require("./BaseEntities");
const shared_1 = require("@game/shared");
class Player extends BaseEntities_1.LivingEntity {
    name;
    mana;
    maxMana;
    manaRegen;
    inventory;
    currentWeaponIndex = 0;
    entityType = 'player';
    gold = 0;
    isInteracting = false;
    inputQueue = [];
    ticksSinceLastInput = 0;
    static INPUT_TIMEOUT_TICKS = 8;
    heldKeys = {
        up: false,
        down: false,
        left: false,
        right: false,
        attack: false,
        interact: false
    };
    roomX = Math.floor(shared_1.GAME_CONFIG.MAP_SIZE / 2);
    roomY = Math.floor(shared_1.GAME_CONFIG.MAP_SIZE / 2);
    lastBroadcastedRoomX = null;
    lastBroadcastedRoomY = null;
    constructor(id, name, x, y, stats, startWeapon, mana, maxMana, manaRegen) {
        super(id, x, y, stats.width, stats.height, stats.speed, stats.visualId, stats.maxHp, stats.maxHp, stats.archetype);
        this.name = name;
        this.mana = mana;
        this.maxMana = maxMana;
        this.manaRegen = manaRegen;
        this.inventory = [startWeapon];
    }
    get activeWeaponVisualId() {
        return this.getActiveWeapon().config.visualId;
    }
    changeWeapon(weaponIndex) {
        if (weaponIndex < this.inventory.length) {
            this.currentWeaponIndex = weaponIndex;
        }
    }
    updateEntity(deltaTime) {
        this.updatePosition(deltaTime);
        if (this.isInvulnerable) {
            this.invulnTimer -= deltaTime;
            if (this.invulnTimer <= 0)
                this.isInvulnerable = false;
        }
        this.mana += this.manaRegen * deltaTime;
        if (this.mana > this.maxMana)
            this.mana = this.maxMana;
    }
    processInputQueue() {
        if (this.inputQueue.length === 0) {
            this.ticksSinceLastInput++;
            if (this.ticksSinceLastInput >= Player.INPUT_TIMEOUT_TICKS) {
                this.heldKeys.up = false;
                this.heldKeys.down = false;
                this.heldKeys.left = false;
                this.heldKeys.right = false;
                this.heldKeys.attack = false;
                this.isInteracting = false;
            }
            return;
        }
        this.ticksSinceLastInput = 0;
        let anyAttack = false;
        let anyInteract = false;
        let lastCommand = null;
        for (const cmd of this.inputQueue) {
            if (cmd.attack)
                anyAttack = true;
            if (cmd.interact)
                anyInteract = true;
            lastCommand = cmd;
        }
        if (lastCommand) {
            this.applyInput(lastCommand.up, lastCommand.down, lastCommand.left, lastCommand.right, anyAttack, anyInteract);
        }
        this.inputQueue = [];
    }
    applyInput(up, down, left, right, isAttacking, interact = false) {
        this.heldKeys.up = up;
        this.heldKeys.down = down;
        this.heldKeys.left = left;
        this.heldKeys.right = right;
        if (interact && !this.heldKeys.interact) {
            this.isInteracting = true;
        }
        if (!interact) {
            this.isInteracting = false;
        }
        this.heldKeys.interact = interact;
        this.heldKeys.attack = isAttacking;
    }
    applyInputFromHeldKeys() {
        this.vx = 0;
        this.vy = 0;
        if (this.heldKeys.up)
            this.vy -= 1;
        if (this.heldKeys.down)
            this.vy += 1;
        if (this.heldKeys.left)
            this.vx -= 1;
        if (this.heldKeys.right)
            this.vx += 1;
    }
    addWeaponToInventory(weapon) {
        if (this.inventory.length >= 3) {
            const toDrop = this.inventory[this.currentWeaponIndex];
            this.inventory[this.currentWeaponIndex] = weapon;
            return toDrop;
        }
        this.inventory.push(weapon);
    }
    addGold(count) {
        this.gold += count;
    }
    getGoldCount() {
        return this.gold;
    }
    getActiveWeapon() {
        return this.inventory[this.currentWeaponIndex];
    }
}
exports.Player = Player;
