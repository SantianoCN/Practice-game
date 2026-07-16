import { EntityStatsDTO } from '@game/shared';
import { LivingEntity } from './BaseEntities';
import { Weapon } from './Weapon';
import { GAME_CONFIG } from '../config/gameConfig';

export class Player extends LivingEntity {
    public inventory: Weapon[];
    public currentWeaponIndex: number = 0;
    public readonly entityType = 'player';
    
    public roomX: number = Math.floor(GAME_CONFIG.MAP_SIZE / 2);
    public roomY: number = Math.floor(GAME_CONFIG.MAP_SIZE / 2);

    constructor(
        id: string,
        public name: string,
        x: number, y: number,
        stats: EntityStatsDTO,
        startWeapon: Weapon,
        public mana: number,
        public maxMana: number
    ) {
        super(id, x, y, 32, 32, stats.speed, stats.sprite, stats.maxHp, stats.maxHp, stats.archetype);
        this.inventory = [startWeapon];
    }

    public applyInput(up: boolean, down: boolean, left: boolean, right: boolean): void {
        this.vx = 0;
        this.vy = 0;
        if (up) this.vy -= 1;
        if (down) this.vy += 1;
        if (left) this.vx -= 1;
        if (right) this.vx += 1;
    }

    public getActiveWeapon(): Weapon {
        return this.inventory[this.currentWeaponIndex];
    }
}