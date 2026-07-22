import { LivingEntity } from './BaseEntities';
import { Weapon } from './Weapon';
import { GAME_CONFIG, EntityStats, EntityType, PlayerCommand } from '@game/shared';

export class Player extends LivingEntity {
    public inventory: Weapon[];
    public currentWeaponIndex: number = 0;
    public readonly entityType: EntityType = 'player';
    public gold: number = 0;
    public isInteracting: boolean = false; 
    public inputQueue: PlayerCommand[] = [];

    public ticksSinceLastInput: number = 0;
    private static readonly INPUT_TIMEOUT_TICKS = 8;
    public isOnline: boolean = true;

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
    }

    get activeWeaponVisualId(): string {
        return this.getActiveWeapon().config.visualId;
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
        if (this.mana > this.maxMana)  this.mana = this.maxMana;
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
        if (this.inventory.length >= 3) {
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

    public getActiveWeapon(): Weapon {
        return this.inventory[this.currentWeaponIndex];
    }
}