import { EntityStatsDTO } from '@game/shared';
import { LivingEntity } from './BaseEntities';
import { Weapon } from './Weapon';
import { Player } from './Player';

export type AIState = 'idle' | 'chase' | 'attack';

export class Enemy extends LivingEntity {
    public currentWeapon: Weapon;
    public targetId: string | null = null;
    public aiState: AIState = 'idle';
    public readonly entityType = 'enemy';

    constructor(id: string, x: number, y: number, stats: EntityStatsDTO, weapon: Weapon) {
        super(id, x, y, 32, 32, stats.speed, stats.sprite, stats.maxHp, stats.maxHp, stats.archetype);
        this.currentWeapon = weapon;
    }

    public updateAI(playersInRoom: Player[]): void {
        if (playersInRoom.length === 0) {
            this.targetId = null;
            this.vx = 0;
            this.vy = 0;
            return;
        }

        let closest: Player | null = null;
        let minDistance = Infinity;

        for (const p of playersInRoom) {
            if (p.isDead()) continue;
            const dist = Math.hypot(p.x - this.x, p.y - this.y);
            if (dist < minDistance) {
                minDistance = dist;
                closest = p;
            }
        }

        if (closest) {
            this.targetId = closest.id;
            this.vx = closest.x - this.x;
            this.vy = closest.y - this.y;
        } else {
            this.vx = 0;
            this.vy = 0;
        }
    }
}