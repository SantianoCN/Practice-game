import { LivingEntity } from './BaseEntities';
import { Weapon } from './Weapon';
import { EntityStats } from '../config/EntityConfigs';

export class Player extends LivingEntity {
    public inventory: Weapon[];
    public currentWeaponIndex: number = 0;
    public readonly entityType = 'player';
    public gold: number = 0;
    
    public roomX: number = 5;
    public roomY: number = 5;

    constructor(
        id: string,
        public name: string,
        x: number, y: number,
        stats: EntityStats,
        startWeapon: Weapon,
        public mana: number,
        public maxMana: number
    ) {
        super(id, x, y, 32, 32, stats.speed, stats.sprite, stats.maxHp, stats.maxHp, stats.archetype);
        this.inventory = [startWeapon];
    }

    public changeWeapon(weaponIdx: number) {
        if (weaponIdx < this.inventory.length) {
            this.currentWeaponIndex = weaponIdx;
        }
    }

    public applyInput(up: boolean, down: boolean, left: boolean, right: boolean): void {
        this.vx = 0;
        this.vy = 0;
        if (up) this.vy -= 1;
        if (down) this.vy += 1;
        if (left) this.vx -= 1;
        if (right) this.vx += 1;
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