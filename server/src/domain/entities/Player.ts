import { LivingEntity } from './BaseEntities';
import { Weapon } from './Weapon';
import { GAME_CONFIG, EntityStats, EntityType } from '@game/shared';

export class Player extends LivingEntity {
    public inventory: Weapon[];
    public currentWeaponIndex: number = 0;
    public readonly entityType: EntityType = 'player';
    public gold: number = 0;
    public isInteracting: boolean = false;
    
    public roomX: number = Math.floor(GAME_CONFIG.MAP_SIZE / 2);
    public roomY: number = Math.floor(GAME_CONFIG.MAP_SIZE / 2);

    constructor(
        id: string,
        public name: string,
        x: number, y: number,
        stats: EntityStats,
        startWeapon: Weapon,
        public mana: number,
        public maxMana: number
    ) {
        super(id, x, y, 32, 32, stats.speed, stats.visualId, stats.maxHp, stats.maxHp, stats.archetype);
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

    public applyInput(up: boolean, down: boolean, left: boolean, right: boolean, interact: boolean = false): void {
        this.vx = 0;
        this.vy = 0;
        if (up) this.vy -= 1;
        if (down) this.vy += 1;
        if (left) this.vx -= 1;
        if (right) this.vx += 1;
        this.isInteracting = interact;
    }

    public addWeaponToInventory(weapon: Weapon): Weapon | void {
        console.log('добавили оружие ' + weapon.name);
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