import LivingEntity from './LivingEntity.js';
import Player from './Player.js';
import { EntityStats } from '../config/types.js';

export default class Enemy extends LivingEntity {
    public aiState: 'idle' | 'chase' | 'attack';
    public targetId: string | null;

    constructor(id: string, archetype: string, x: number, y: number, presetStats: EntityStats) {
        super(id, 'enemy', x, y, 32, 32, archetype);
        this.aiState = 'chase';
        this.targetId = null;

        this.maxHp = presetStats.maxHp;
        this.hp = presetStats.maxHp;
        this.speed = presetStats.speed;
        this.spriteKey = presetStats.spriteKey;
    }

    public updateTarget(allPlayers: Player[]): void {
        if (allPlayers.length === 0) {
            this.targetId = null;
            this.vx = 0;
            this.vy = 0;
            return;
        }

        let closestPlayer: Player | null = null;
        let minDistance = Infinity;

        for (const player of allPlayers) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance) {
                minDistance = distance;
                closestPlayer = player;
            }
        }

        if (closestPlayer) {
            this.targetId = closestPlayer.id;
            
            this.vx = closestPlayer.x - this.x;
            this.vy = closestPlayer.y - this.y;
        }
    }

    override die(): void {
        this.vx = 0;
        this.vy = 0;
    }
}