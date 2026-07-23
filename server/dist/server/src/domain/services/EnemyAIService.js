"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnemyAIService = void 0;
const CollisionEngine_1 = require("../physics/CollisionEngine");
const mctsModule = require('../../../build/Release/mcts.node');
class EnemyAIService {
    static mctsInstances = new Map();
    static MCTS_ITERATIONS = 100;
    static MCTS_C_VALUE = 1.5;
    static MAP_WIDTH = 200;
    static MAP_HEIGHT = 200;
    static lastUpdateTime = new Map();
    static UPDATE_INTERVAL_MS = 60;
    static MCTS_RANGE = 400;
    static updateEnemies(enemies, players, room, deltaTime, currentTime, roomWidth, roomHeight, generateId) {
        const alivePlayers = players.filter(p => !p.isDead());
        for (const enemy of enemies) {
            if (enemy.isDead()) {
                enemy.vx = 0;
                enemy.vy = 0;
                continue;
            }
            let closestPlayer = null;
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
                    const state = this.buildMCTSState(enemy, alivePlayers);
                    const result = mcts.findBestAction(state);
                    console.log(result);
                    this.applyMCTSAction(enemy, closestPlayer, result, attackRange);
                }
            }
            else {
                this.applySimpleAI(enemy, closestPlayer, distance, attackRange);
            }
            enemy.updateEntity(deltaTime);
            CollisionEngine_1.CollisionEngine.resolveWallBounds(enemy, roomWidth, roomHeight, room, false);
            CollisionEngine_1.CollisionEngine.resolveObstacles(enemy, room.getObstacleGrid());
            if (enemy.aiState === 'attack' && enemy.targetId && closestPlayer) {
                const dirX = closestPlayer.x - enemy.x;
                const dirY = closestPlayer.y - enemy.y;
                const dist = Math.hypot(dirX, dirY);
                if (dist > 0 && dist <= attackRange) {
                    const bullet = enemy.currentWeapon.fire(generateId('bullet'), enemy.id, 'enemy', enemy.x, enemy.y, Infinity, dirX / dist, dirY / dist, currentTime);
                    if (bullet) {
                        room.bullets.push(bullet);
                    }
                }
            }
        }
    }
    static getMCTSInstance(enemyId) {
        let mcts = this.mctsInstances.get(enemyId);
        if (!mcts) {
            mcts = new mctsModule.MCTS(this.MAP_WIDTH, this.MAP_HEIGHT, this.MCTS_ITERATIONS, this.MCTS_C_VALUE);
            this.mctsInstances.set(enemyId, mcts);
        }
        return mcts;
    }
    static buildMCTSState(enemy, players) {
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
            }))
        };
    }
    static applyMCTSAction(enemy, target, result, attackRange) {
        const distance = Math.hypot(target.x - enemy.x, target.y - enemy.y);
        const actionName = result.actionName;
        switch (actionName) {
            case 'Атака':
                if (distance <= attackRange) {
                    enemy.aiState = 'attack';
                    enemy.vx = 0;
                    enemy.vy = 0;
                }
                else {
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
                enemy.aiState = 'retreat';
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
                enemy.aiState = 'strafe';
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
                }
                else {
                    enemy.aiState = 'idle';
                }
                break;
        }
    }
    static applySimpleAI(enemy, target, distance, attackRange) {
        enemy.targetId = target.id;
        const dx = target.x - enemy.x;
        const dy = target.y - enemy.y;
        if (distance <= attackRange) {
            enemy.aiState = 'attack';
            enemy.vx = 0;
            enemy.vy = 0;
        }
        else {
            enemy.aiState = 'chase';
            if (distance > 0) {
                enemy.vx = dx / distance;
                enemy.vy = dy / distance;
            }
        }
    }
    static clearCache() {
        this.mctsInstances.clear();
        this.lastUpdateTime.clear();
    }
}
exports.EnemyAIService = EnemyAIService;
