import { LivingEntity } from './BaseEntities';
import { Weapon } from './Weapon';
import { EntityStats, EntityType } from '@game/shared';

export type AIState = 'idle' | 'chase' | 'attack';

export class Enemy extends LivingEntity {
    public currentWeapon: Weapon;
    public targetId: string | null = null;
    public aiState: AIState = 'idle';
    public readonly entityType: EntityType = 'enemy';

    constructor(id: string, x: number, y: number, stats: EntityStats, weapon: Weapon) {
        super(id, x, y, stats.width, stats.height, stats.speed, stats.visualId, stats.maxHp, stats.maxHp, stats.archetype);
        this.currentWeapon = weapon;
    }
}