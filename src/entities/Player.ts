import LivingEntity from './LivingEntity.js';
import { EntityStats } from '../config/types.js';

export default class Player extends LivingEntity {
    public name: string;
    public inventory: string[];
    public currentWeaponId: string;

    constructor(id: string, name: string, archetype: string, x: number, y: number, presetStats: EntityStats) {
        super(id, 'player', x, y, 32, 32, archetype);
        this.name = name;
        this.inventory = [];
        this.currentWeaponId = 'default_sword';

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

    public addItemToInventory(itemId: string): void {
        this.inventory.push(itemId);
    }

    public equipWeapon(weaponId: string): void {
        this.currentWeaponId = weaponId;
    }

    override die(): void {
        this.vx = 0;
        this.vy = 0;
    }
}