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

class Pathfinder {
    private static readonly CELL_SIZE = 20;

    static isWalkable(
        x: number, y: number,
        obstacles: Obstacle[],
        roomWidth: number, roomHeight: number
    ): boolean {
        if (x < 0 || x >= roomWidth || y < 0 || y >= roomHeight) return false;
        const halfSize = this.CELL_SIZE / 2;
        for (const ob of obstacles) {
            const closestX = Math.max(ob.x - ob.width / 2, Math.min(x, ob.x + ob.width / 2));
            const closestY = Math.max(ob.y - ob.height / 2, Math.min(y, ob.y + ob.height / 2));
            const distX = x - closestX;
            const distY = y - closestY;
            if (distX * distX + distY * distY < halfSize * halfSize) return false;
        }
        return true;
    }

    static hasLineOfSight(
        x0: number, y0: number, x1: number, y1: number,
        obstacles: Obstacle[],
        roomWidth: number, roomHeight: number
    ): boolean {
        const dist = Math.hypot(x1 - x0, y1 - y0);
        const steps = Math.max(1, Math.ceil(dist / (this.CELL_SIZE / 2)));
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const x = x0 + (x1 - x0) * t;
            const y = y0 + (y1 - y0) * t;
            if (!this.isWalkable(x, y, obstacles, roomWidth, roomHeight)) return false;
        }
        return true;
    }

    static nextStepDirection(
        fromX: number, fromY: number,
        toX: number, toY: number,
        obstacles: Obstacle[],
        roomWidth: number, roomHeight: number
    ): { dx: number; dy: number } {
        if (this.hasLineOfSight(fromX, fromY, toX, toY, obstacles, roomWidth, roomHeight)) {
            const dist = Math.hypot(toX - fromX, toY - fromY);
            if (dist < 1e-6) return { dx: 0, dy: 0 };
            return { dx: (toX - fromX) / dist, dy: (toY - fromY) / dist };
        }

        const cell = this.CELL_SIZE;
        const cols = Math.ceil(roomWidth / cell);
        const rows = Math.ceil(roomHeight / cell);
        const start = { x: Math.floor(fromX / cell), y: Math.floor(fromY / cell) };
        const goal = { x: Math.floor(toX / cell), y: Math.floor(toY / cell) };

        if (start.x === goal.x && start.y === goal.y) return { dx: 0, dy: 0 };

        const cellWalkable = (cx: number, cy: number) =>
            this.isWalkable(cx * cell + cell / 2, cy * cell + cell / 2, obstacles, roomWidth, roomHeight);

        const key = (x: number, y: number) => y * cols + x;
        const visited = new Set<number>([key(start.x, start.y)]);
        const cameFrom = new Map<number, number>();
        const queue: Array<{ x: number; y: number }> = [start];
        const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        let found = false;

        while (queue.length > 0) {
            const cur = queue.shift()!;
            if (cur.x === goal.x && cur.y === goal.y) { found = true; break; }
            for (const [ddx, ddy] of dirs) {
                const nx = cur.x + ddx, ny = cur.y + ddy;
                if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
                if (!cellWalkable(nx, ny)) continue;
                const k = key(nx, ny);
                if (visited.has(k)) continue;
                visited.add(k);
                cameFrom.set(k, key(cur.x, cur.y));
                queue.push({ x: nx, y: ny });
            }
        }

        if (!found) return { dx: 0, dy: 0 };

        let curKey = key(goal.x, goal.y);
        let prevKey = cameFrom.get(curKey);
        if (prevKey === undefined) return { dx: 0, dy: 0 };
        while (prevKey !== key(start.x, start.y)) {
            curKey = prevKey;
            prevKey = cameFrom.get(curKey)!;
        }

        const stepX = (curKey % cols) * cell + cell / 2;
        const stepY = Math.floor(curKey / cols) * cell + cell / 2;
        const dx = stepX - fromX, dy = stepY - fromY;
        const dist = Math.hypot(dx, dy);
        if (dist < 1e-6) return { dx: 0, dy: 0 };
        return { dx: dx / dist, dy: dy / dist };
    }
}

export class EnemyAIService {

    private static mctsInstances: Map<string, any> = new Map();

    private static readonly MCTS_ITERATIONS = 40;
    private static readonly MCTS_C_VALUE = 0.5;
    private static readonly MAP_WIDTH = 800;
    private static readonly MAP_HEIGHT = 600;

    private static lastUpdateTime: Map<string, number> = new Map();
    private static readonly UPDATE_INTERVAL_MS = 250;

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

                    this.applyMCTSAction(enemy, closestPlayer, result, attackRange, room, roomWidth, roomHeight);
                }

            } else {
                this.applySimpleAI(enemy, closestPlayer, distance, attackRange, room, roomWidth, roomHeight);
            }

            enemy.updateEntity(deltaTime);
            CollisionEngine.resolveWallBounds(enemy, roomWidth, roomHeight, room, false);
            CollisionEngine.resolveObstacles(enemy, room.getObstacleGrid());

            if (enemy.aiState === 'attack' && enemy.targetId && closestPlayer) {
                const dirX = closestPlayer.x - enemy.x;
                const dirY = closestPlayer.y - enemy.y;
                const dist = Math.hypot(dirX, dirY);

                const hasLOS = Pathfinder.hasLineOfSight(
                    enemy.x, enemy.y, closestPlayer.x, closestPlayer.y,
                    room.obstacles, roomWidth, roomHeight
                );

                if (dist > 0 && dist <= attackRange && hasLOS) {
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
                x: Math.floor(obs.x - obs.width / 2),
                y: Math.floor(obs.y - obs.height / 2),
                width: Math.floor(obs.width),
                height: Math.floor(obs.height)
            }))
        };
    }

    private static moveTowardsAvoidingObstacles(
        enemy: Enemy, targetX: number, targetY: number,
        room: Room, roomWidth: number, roomHeight: number
    ): void {
        const { dx, dy } = Pathfinder.nextStepDirection(
            enemy.x, enemy.y, targetX, targetY,
            room.obstacles, roomWidth, roomHeight
        );
        enemy.vx = dx;
        enemy.vy = dy;
    }

    private static applyMCTSAction(
        enemy: Enemy,
        target: Player,
        result: MCTSResult,
        attackRange: number,
        room: Room,
        roomWidth: number,
        roomHeight: number
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
                    this.moveTowardsAvoidingObstacles(enemy, target.x, target.y, room, roomWidth, roomHeight);
                }
                break;

            case 'Сближение':
                enemy.aiState = 'chase';
                this.moveTowardsAvoidingObstacles(enemy, target.x, target.y, room, roomWidth, roomHeight);
                break;

            case 'Отступление': {
                enemy.aiState = 'chase';
                const awayX = enemy.x + (enemy.x - target.x);
                const awayY = enemy.y + (enemy.y - target.y);
                this.moveTowardsAvoidingObstacles(enemy, awayX, awayY, room, roomWidth, roomHeight);
                break;
            }

            case 'Стрейф влево':
            case 'Стрейф вправо': {
                enemy.aiState = 'chase';
                const dxS = target.x - enemy.x;
                const dyS = target.y - enemy.y;
                const distS = Math.hypot(dxS, dyS);
                if (distS > 0) {
                    const isLeft = actionName === 'Стрейф влево';
                    const perpX = (isLeft ? -dyS : dyS) / distS;
                    const perpY = (isLeft ? dxS : -dxS) / distS;
                    const targetX = enemy.x + perpX * 50;
                    const targetY = enemy.y + perpY * 50;
                    this.moveTowardsAvoidingObstacles(enemy, targetX, targetY, room, roomWidth, roomHeight);
                }
                break;
            }

            case 'Вверх':
            case 'Вниз':
            case 'Влево':
            case 'Вправо': {
                const stepMap: Record<string, [number, number]> = {
                    'Вверх': [0, -1], 'Вниз': [0, 1], 'Влево': [-1, 0], 'Вправо': [1, 0]
                };
                const [sdx, sdy] = stepMap[actionName];
                const targetX = enemy.x + sdx * 50;
                const targetY = enemy.y + sdy * 50;
                enemy.aiState = 'chase';
                this.moveTowardsAvoidingObstacles(enemy, targetX, targetY, room, roomWidth, roomHeight);
                break;
            }

            case 'Ждать':
            default:
                enemy.vx = 0;
                enemy.vy = 0;
                enemy.aiState = distance <= attackRange ? 'attack' : 'idle';
                break;
        }
    }

    private static applySimpleAI(
        enemy: Enemy,
        target: Player,
        distance: number,
        attackRange: number,
        room: Room,
        roomWidth: number,
        roomHeight: number
    ): void {
        enemy.targetId = target.id;

        if (distance <= attackRange) {
            enemy.aiState = 'attack';
            enemy.vx = 0;
            enemy.vy = 0;
        } else {
            enemy.aiState = 'chase';
            this.moveTowardsAvoidingObstacles(enemy, target.x, target.y, room, roomWidth, roomHeight);
        }
    }

    public static clearCache(): void {
        this.mctsInstances.clear();
        this.lastUpdateTime.clear();
    }
}