import LivingEntity from './LivingEntity';
import { EntityStats } from '../../config/types';
import Weapon from '../items/Weapon';

export default class Player extends LivingEntity {
    public name: string;
    public inventory: Weapon[];
    public currentWeaponIndex: number;

    constructor(id: string, name: string, archetype: string, x: number, y: number, presetStats: EntityStats, startWeapon: Weapon) {
        super(id, 'player', x, y, 32, 32, archetype);
        this.name = name;
        this.inventory = [startWeapon];
        this.currentWeaponIndex = 0;

        this.maxHp = presetStats.maxHp;
        this.hp = presetStats.maxHp;
        this.maxMana = presetStats.maxMana;
        this.mana = presetStats.maxMana;
        this.speed = presetStats.speed;
        this.spriteKey = presetStats.spriteKey;
    }

    public setDirection(inputX: number, inputY: number): void {
        this.vx = inputX;
        this.vy = inputY;
    }

    public addWeaponToInventory(newWeapon: Weapon): void {
        if (this.inventory.length < 3) {
            this.inventory.push(newWeapon);
        } else {
            this.inventory[this.currentWeaponIndex] = newWeapon;
        }
    }

    public equipWeapon(index: number): void {
        if (index >= 0 && index < this.inventory.length) {
            this.currentWeaponIndex = index;
        }
    }

    public getActiveWeapon(): Weapon {
        return this.inventory[this.currentWeaponIndex];
    }

    override die(): void {
        this.vx = 0;
        this.vy = 0;
    }
}