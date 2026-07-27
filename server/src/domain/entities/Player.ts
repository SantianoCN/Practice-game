import { LivingEntity } from './BaseEntities';
import { Weapon } from './Weapon';
import { GAME_CONFIG, EntityStats, EntityType, PlayerCommand, ActiveEffect } from '@game/shared';

export class Player extends LivingEntity {
    public inventory: Weapon[];
    public currentWeaponIndex: number = 0;
    public readonly entityType: EntityType = 'player';
    public gold: number = 0;
    public isInteracting: boolean = false; 
    public inputQueue: PlayerCommand[] = [];
    public readonly baseSpeed: number;
    public readonly baseMaxHp: number;
    public readonly baseManaRegen: number;
    public activeEffects = new Map<string, ActiveEffect>();

    public ticksSinceLastInput: number = 0;
    private static readonly INPUT_TIMEOUT_TICKS = 8;
    public isOnline: boolean = true;
    public maxInventoryLength: number;

    public heldKeys = {
        up: false,
        down: false,
        left: false,
        right: false,
        attack: false,
        interact: false
    };
    
    public roomX: number = Math.floor(GAME_CONFIG.MAP_SIZE / 2);
    public roomY: number = Math.floor(GAME_CONFIG.MAP_SIZE / 2);
    public lastBroadcastedRoomX: number | null = null;
    public lastBroadcastedRoomY: number | null = null;

    constructor(
        id: string,
        public name: string,
        x: number, y: number,
        stats: EntityStats,
        startWeapon: Weapon,
        public mana: number,
        public maxMana: number,
        public manaRegen: number
    ) {
        super(id, x, y, stats.width, stats.height, stats.speed, stats.visualId, stats.maxHp, stats.maxHp, stats.archetype);
        this.inventory = [startWeapon];
        this.maxInventoryLength = stats.maxInventoryLength;
        this.baseSpeed = stats.speed;
        this.baseMaxHp = stats.maxHp;
        this.baseManaRegen = stats.manaRegen;
    }

    public getActiveWeapon(): Weapon {
        return this.inventory[this.currentWeaponIndex] || this.inventory[0];
    }

    get activeWeaponVisualId(): string {
        const weapon = this.getActiveWeapon();
        return weapon?.config?.visualId || 'iron_sword';
    }

    public changeWeapon(weaponIndex: number) {
        if (weaponIndex < this.inventory.length) {
            this.currentWeaponIndex = weaponIndex;
        }
    }

    public override updateEntity(deltaTime: number): void {
        this.updatePosition(deltaTime);
        if (this.isInvulnerable) {
            this.invulnTimer -= deltaTime;
            if (this.invulnTimer <= 0) this.isInvulnerable = false;
        }
        
        this.mana += this.manaRegen * deltaTime;
        if (this.mana > this.maxMana) this.mana = this.maxMana;

        if (this.activeEffects.size > 0) {
            let hasExpired = false;

            for (const [id, effect] of this.activeEffects.entries()) {
                effect.duration -= deltaTime;
                if (effect.duration <= 0) {
                    this.activeEffects.delete(id);
                    hasExpired = true;
                }
            }

            if (hasExpired) {
                this.recalculateStats();
            }
        }
    }

    public addEffect(effect: ActiveEffect): void {
        this.activeEffects.set(effect.id, { ...effect });
        this.recalculateStats();
    }

    public recalculateStats(): void {
        let speedBonus = 0;
        let maxHpBonus = 0;
        let manaRegenBonus = 0;

        for (const effect of this.activeEffects.values()) {
            if (effect.modifiers.speedBonus) speedBonus += effect.modifiers.speedBonus;
            if (effect.modifiers.maxHpBonus) maxHpBonus += effect.modifiers.maxHpBonus;
            if (effect.modifiers.manaRegenBonus) manaRegenBonus += effect.modifiers.manaRegenBonus;
        }

        this.speed = this.baseSpeed + speedBonus;
        this.maxHp = this.baseMaxHp + maxHpBonus;
        this.manaRegen = this.baseManaRegen + manaRegenBonus;

        if (this.hp > this.maxHp) this.hp = this.maxHp;
    }

    public processInputQueue(): void {
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
        let lastCommand: PlayerCommand | null = null;

        for (const cmd of this.inputQueue) {
            if (cmd.attack) anyAttack = true;
            if (cmd.interact) anyInteract = true;
            lastCommand = cmd;
        }

        if (lastCommand) {
            this.applyInput(
                lastCommand.up,
                lastCommand.down,
                lastCommand.left,
                lastCommand.right,
                anyAttack,
                anyInteract
            );
        }

        this.inputQueue = [];
    }

    public applyInput(up: boolean, down: boolean, left: boolean, right: boolean, isAttacking: boolean, interact: boolean = false): void {
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

    public applyInputFromHeldKeys(): void {
        this.vx = 0;
        this.vy = 0;
        if (this.heldKeys.up) this.vy -= 1;
        if (this.heldKeys.down) this.vy += 1;
        if (this.heldKeys.left) this.vx -= 1;
        if (this.heldKeys.right) this.vx += 1;
    }

    public addWeaponToInventory(weapon: Weapon): Weapon | void {
        if (this.inventory.length >= this.maxInventoryLength) {
            const toDrop = this.inventory[this.currentWeaponIndex];
            this.inventory[this.currentWeaponIndex] = weapon;
            return toDrop;
        }
        this.inventory.push(weapon);
    }

    public addGold(count: number): void {
        this.gold += count;
    }

    public getGoldCount(): number {
        return this.gold;
    }

    public revive(amount?: number): void {
        this.hp = amount ?? Math.floor(this.maxHp / 2);
    }
}