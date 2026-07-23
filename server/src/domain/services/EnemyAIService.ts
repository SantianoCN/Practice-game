import { Enemy } from '../entities/Enemy';
import { Obstacle } from '../entities/Obstacle';
import { Player } from '../entities/Player';
import { Room } from '../entities/Room';
import { CollisionEngine } from '../physics/CollisionEngine';
import { IDGenerator } from '@game/shared';

const mctsModule = require('../../../build/Release/mcts.node');


interface MCTSState {
    npc_hp: number;
    npc_x: number;
    npc_y: number;
    npc_vx: number;
    npc_vy: number;
    npc_damage: number;
    npc_speed: number;
    npc_range: number;
    players: Array<{
        hp: number;
        x: number;
        y: number;
        vx: number;
        vy: number;
        damage: number;
        range: number;
        speed: number;
    }>;
    obstacles: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
}

interface MCTSResult {
    action: number;
    actionName: string;
}

export class EnemyAIService {

    private static mctsInstances: Map<string, any> = new Map();


    private static readonly MCTS_ITERATIONS = 80;
    private static readonly MCTS_C_VALUE = 0.3;
    private static readonly MAP_WIDTH = 800;
    private static readonly MAP_HEIGHT = 600;


    private static lastUpdateTime: Map<string, number> = new Map();
    private static readonly UPDATE_INTERVAL_MS = 60;


    private static readonly MCTS_RANGE = 1000;

    public static updateEnemies(
        enemies: Enemy[],
        players: Player[],
        room: Room,
        deltaTime: number,
        currentTime: number,
        roomWidth: number,
        roomHeight: number,
        generateId: IDGenerator
    ): void {

        const alivePlayers = players.filter(p => !p.isDead());

        for (const enemy of enemies) {
            if (enemy.isDead()) {
                enemy.vx = 0;
                enemy.vy = 0;
                continue;
            }

            let closestPlayer: Player | null = null;
            let minDistance = Infinity;

            for (const player of alivePlayers) {
                const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPlayer = player;
                }
            }

            if (!closestPlayer) {
                enemy.aiState = 'idle';
                enemy.targetId = null;
                enemy.vx = 0;
                enemy.vy = 0;
                continue;
            }

            enemy.targetId = closestPlayer.id;
            const dx = closestPlayer.x - enemy.x;
            const dy = closestPlayer.y - enemy.y;
            const distance = Math.hypot(dx, dy);
            const attackRange = enemy.currentWeapon ? (enemy.currentWeapon.config.projectile.range * 0.8) : 50;



            const useMCTS = distance < this.MCTS_RANGE;

            if (useMCTS) {

                const lastUpdate = this.lastUpdateTime.get(enemy.id) || 0;
                if (currentTime - lastUpdate >= this.UPDATE_INTERVAL_MS) {
                    this.lastUpdateTime.set(enemy.id, currentTime);


                    const mcts = this.getMCTSInstance(enemy.id);


                    const state = this.buildMCTSState(enemy, alivePlayers, room);


                    const result = mcts.findBestAction(state);

                    this.applyMCTSAction(enemy, closestPlayer, result, attackRange);
                }

            } else {

                this.applySimpleAI(enemy, closestPlayer, distance, attackRange);
            }


            enemy.updateEntity(deltaTime);
            CollisionEngine.resolveWallBounds(enemy, roomWidth, roomHeight, room, false);
            CollisionEngine.resolveObstacles(enemy, room.getObstacleGrid());


            if (enemy.aiState === 'attack' && enemy.targetId && closestPlayer) {
                const dirX = closestPlayer.x - enemy.x;
                const dirY = closestPlayer.y - enemy.y;
                const dist = Math.hypot(dirX, dirY);

                if (dist > 0 && dist <= attackRange) {
                    const bullet = enemy.currentWeapon.fire(
                        generateId('bullet'),
                        enemy.id,
                        'enemy',
                        enemy.x,
                        enemy.y,
                        Infinity,
                        dirX / dist,
                        dirY / dist,
                        currentTime
                    );

                    if (bullet) {
                        room.bullets.push(bullet);
                    }
                }
            }
        }
    }



    private static getMCTSInstance(enemyId: string): any {
        let mcts = this.mctsInstances.get(enemyId);
        if (!mcts) {
            mcts = new mctsModule.MCTS(
                this.MAP_WIDTH,
                this.MAP_HEIGHT,
                this.MCTS_ITERATIONS,
                this.MCTS_C_VALUE
            );
            this.mctsInstances.set(enemyId, mcts);
        }
        return mcts;
    }

    private static buildMCTSState(enemy: Enemy, players: Player[], room: Room): MCTSState {
        const attackRange = enemy.currentWeapon ? (enemy.currentWeapon.config.projectile.range) : 50;
        //console.log(room);
        return {
            npc_hp: enemy.hp,
            npc_x: Math.floor(enemy.x),
            npc_y: Math.floor(enemy.y),
            npc_vx: Math.floor(enemy.vx),
            npc_vy: Math.floor(enemy.vy),
            npc_damage: 10,
            npc_speed: Math.floor(enemy.speed),
            npc_range: Math.floor(attackRange),
            players: players.map(p => ({
                hp: p.hp,
                x: Math.floor(p.x),
                y: Math.floor(p.y),
                vx: Math.floor(p.vx),
                vy: Math.floor(p.vy),
                damage: 10,
                range: Math.floor(p.inventory[p.currentWeaponIndex] ? p.inventory[p.currentWeaponIndex].config.projectile.range : 50),
                speed: Math.floor(p.speed)
            })),
            obstacles: room.obstacles.map(obs => ({
                x: Math.floor(obs.x),
                y: Math.floor(obs.y),
                width: Math.floor(obs.width),
                height: Math.floor(obs.height)
            }))
        };
    }

    private static applyMCTSAction(
        enemy: Enemy,
        target: Player,
        result: MCTSResult,
        attackRange: number
    ): void {
        const distance = Math.hypot(target.x - enemy.x, target.y - enemy.y);
        const actionName = result.actionName;

        if (distance >= attackRange * 0.8 && distance <= attackRange) {
            if (actionName === 'Атака' || actionName === 'Ждать') {
                enemy.vx = 0;
                enemy.vy = 0;
                enemy.aiState = 'attack';
                return;
            }
        }

        switch (actionName) {
            case 'Атака':
                if (distance <= attackRange) {
                    enemy.aiState = 'attack';
                    enemy.vx = 0;
                    enemy.vy = 0;
                } else {

                    enemy.aiState = 'chase';
                    const dx = target.x - enemy.x;
                    const dy = target.y - enemy.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist > 0) {
                        enemy.vx = dx / dist;
                        enemy.vy = dy / dist;
                    }
                }
                break;

            case 'Сближение':
                enemy.aiState = 'chase';
                const dxC = target.x - enemy.x;
                const dyC = target.y - enemy.y;
                const distC = Math.hypot(dxC, dyC);
                if (distC > 0) {
                    enemy.vx = dxC / distC;
                    enemy.vy = dyC / distC;
                }
                break;

            case 'Отступление':
                enemy.aiState = 'chase';
                const dxR = target.x - enemy.x;
                const dyR = target.y - enemy.y;
                const distR = Math.hypot(dxR, dyR);
                if (distR > 0) {
                    enemy.vx = -dxR / distR;
                    enemy.vy = -dyR / distR;
                }
                break;

            case 'Стрейф влево':
            case 'Стрейф вправо':
                enemy.aiState = 'chase';
                const dxS = target.x - enemy.x;
                const dyS = target.y - enemy.y;
                const distS = Math.hypot(dxS, dyS);
                if (distS > 0) {

                    const isLeft = actionName === 'Стрейф влево';
                    enemy.vx = (isLeft ? -dyS : dyS) / distS;
                    enemy.vy = (isLeft ? dxS : -dxS) / distS;
                }
                break;

            case 'Вверх':
                enemy.vx = 0;
                enemy.vy = -1;
                enemy.aiState = 'chase';
                break;

            case 'Вниз':
                enemy.vx = 0;
                enemy.vy = 1;
                enemy.aiState = 'chase';
                break;

            case 'Влево':
                enemy.vx = -1;
                enemy.vy = 0;
                enemy.aiState = 'chase';
                break;

            case 'Вправо':
                enemy.vx = 1;
                enemy.vy = 0;
                enemy.aiState = 'chase';
                break;

            case 'Ждать':
            default:
                enemy.vx = 0;
                enemy.vy = 0;
                if (distance <= attackRange) {
                    enemy.aiState = 'attack';
                } else {
                    enemy.aiState = 'idle';
                }
                break;
        }
    }

    private static applySimpleAI(
        enemy: Enemy,
        target: Player,
        distance: number,
        attackRange: number
    ): void {
        enemy.targetId = target.id;
        const dx = target.x - enemy.x;
        const dy = target.y - enemy.y;

        if (distance <= attackRange) {
            enemy.aiState = 'attack';
            enemy.vx = 0;
            enemy.vy = 0;
        } else {
            enemy.aiState = 'chase';
            if (distance > 0) {
                enemy.vx = dx / distance;
                enemy.vy = dy / distance;
            }
        }
    }

    public static clearCache(): void {
        this.mctsInstances.clear();
        this.lastUpdateTime.clear();
    }
}