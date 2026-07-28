import { time } from 'console';
import { Enemy } from '../entities/Enemy';
import { Obstacle } from '../entities/Obstacle';
import { Player } from '../entities/Player';
import { Room } from '../entities/Room';
import { CollisionEngine } from '../physics/CollisionEngine';
import { IDGenerator, GAME_CONFIG } from '@game/shared';
import { getEnabledCategories } from 'trace_events';
import { ActionFn, engage, flank, GenerateIdFn, kite, retreat, wait } from './EnemyActions';

let mctsModule: any = null;
try {
    mctsModule = require('../../../build/Release/mcts.node');
} catch (e) {
    console.warn('[EnemyAIService] MCTS модуль не найден');
}

export enum ActionType {
    Engage,
    Kite,
    Flank,
    Retreat,
    Wait,
    None
}

interface GameState {
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

type ActionCallback = () => void;

export class EnemyAction {
    public action: ActionType = ActionType.Wait;
    public isCompleted: boolean = false;
    public isTimeout: boolean = false;
    public startedAt: number = 0;
}

export class EnemyAIService {
    private static readonly actions: Map<ActionType, ActionFn> = new Map([
        [ActionType.Engage, engage],
        [ActionType.Kite, kite],
        [ActionType.Flank, flank],
        [ActionType.Retreat, retreat],
        [ActionType.Wait, wait]
    ]);
    private static pendingUpdates: Map<string, boolean> = new Map();

    private static MCTS_TIMEOUT_INTERVAL: number = 2500;    // могут быть проблемы с малыми значениями
    private static MCTS_C_VALUE: number = 0.4;
    private static MCTS_MAX_ITERATIONS: number = 50;

    private static enemies: Map<string, EnemyAction> = new Map();
    private static mctsInstance: any = new mctsModule.MCTS(
        800,
        600,
        EnemyAIService.MCTS_MAX_ITERATIONS,
        EnemyAIService.MCTS_C_VALUE
    );

    public static updateEnemies(
        enemies: Enemy[],
        players: Player[],
        room: Room,
        deltaTime: number,
        currentTime: number,
        roomWidth: number,
        roomHeight: number,
        idGenerate: GenerateIdFn
    ): void {
        for (const enemy of enemies) {
            if (enemy.isDead()) {
                EnemyAIService.cleanUp(enemy);
                continue;
            }

            if (!EnemyAIService.enemies.has(enemy.id)) {
                EnemyAIService.addEnemy(enemy);
                EnemyAIService.setTimeout(enemy, currentTime);
            }
            EnemyAIService.incTime(enemy, currentTime);

            const ec = EnemyAIService.enemies.get(enemy.id);
            if (!ec) continue;

            let action = ec.action;
            if ((ec.isCompleted || ec.isTimeout) 
                && !EnemyAIService.pendingUpdates.get(enemy.id)
            ) {
                const gameState = EnemyAIService.mapState(enemy, players, room.obstacles);
                EnemyAIService.pendingUpdates.set(enemy.id, true);

                action = EnemyAIService.updateAction(enemy, gameState, currentTime);
                    ec.isCompleted = false;
                    ec.isTimeout = false;
                // setImmediate(() => {
                //     action = EnemyAIService.updateAction(enemy, gameState, currentTime);
                //     ec.isCompleted = false;
                //     ec.isTimeout = false;
                //     EnemyAIService.pendingUpdates.set(enemy.id, false);
                // });
            }
            EnemyAIService.executeAction(
                enemy, 
                players, 
                action, 
                idGenerate, 
                room, 
                roomWidth, 
                roomHeight, 
                currentTime
            );

            enemy.updateEntity(deltaTime);
            CollisionEngine.resolveWallBounds(enemy, roomWidth, roomHeight, room, false);
            CollisionEngine.resolveObstacles(enemy, room.getObstacleGrid());
        }
    }

    public static mapState(
        enemy: Enemy,
        players: Player[],
        obstacles: Obstacle[]
    ): GameState {
        return {
            npc_x: enemy.x,
            npc_y: enemy.y,
            npc_hp: enemy.hp,
            npc_speed: enemy.speed,
            npc_vx: enemy.vx,
            npc_vy: enemy.vy,
            npc_damage: enemy.currentWeapon.config.projectile.damage,
            npc_range: enemy.currentWeapon.config.projectile.range,
            players: players.map(player => {
                return {
                    hp: player.hp,
                    speed: player.speed,
                    damage: player.inventory[player.currentWeaponIndex]
                        .config
                        .projectile
                        .damage,
                    range: player.inventory[player.currentWeaponIndex]
                        .config
                        .projectile
                        .range,
                    x: player.x,
                    y: player.y,
                    vx: player.vx,
                    vy: player.vy,
                }
            }),
            obstacles: obstacles.map(ob => {
                return {
                    x: ob.x,
                    y: ob.y,
                    width: ob.width,
                    height: ob.height
                }
            })
        }
    }

    public static setTimeout(
        enemy: Enemy,
        currentTime: number
    ): void {
        const info = EnemyAIService.enemies.get(enemy.id);
        if (!info) return;
        info.startedAt = currentTime;
    }

    public static incTime(enemy: Enemy, currentTime: number): void {
        const ec = EnemyAIService.enemies.get(enemy.id);
        if (!ec) return;
        ec.isTimeout = (currentTime - ec.startedAt) >= EnemyAIService.MCTS_TIMEOUT_INTERVAL;
    }

    public static updateAction(
        enemy: Enemy,
        state: GameState,
        currentTime: number
    ): ActionType {
        //const result = { actionName: 'Engage'};
        const result = EnemyAIService.mctsInstance.findBestAction(state);
        console.log(result.actionName);
        const ec = EnemyAIService.enemies.get(enemy.id);
        if (!ec) return ActionType.None;

        const actionName = result.actionName as string;
        ec!.action = ActionType[actionName as keyof typeof ActionType];
        ec.startedAt = currentTime;
        ec.isTimeout = false;
        EnemyAIService.setTimeout(enemy, currentTime);

        return ec.action;
    }

    public static executeAction(
        enemy: Enemy,
        players: Player[],
        action: ActionType,
        gen: GenerateIdFn,
        room: Room,
        roomWidth: number,
        roomHeight: number,
        currentTime: number
    ): void {
        const ac = EnemyAIService.actions.get(action);
        if (!ac) return;

        const target = EnemyAIService.find_closest_target(enemy, players);
        if (!target) return;

        const isComplete = ac(enemy, target, gen, room, roomWidth, roomHeight, currentTime);

        const ec = EnemyAIService.enemies.get(enemy.id);
        if (!ec) return;

        ec.isCompleted = isComplete;
    }

    public static find_closest_target(
        enemy: Enemy,
        players: Player[]
    ): Player | null {
        if (players.length === 0) return null;

        let best = players[0];
        let min_dist = Number.MAX_VALUE;
        for (const player of players) {
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < min_dist) {
                min_dist = dist;
                best = player;
            }
        }
        return best;
    }

    public static addEnemy(enemy: Enemy): void {
        EnemyAIService.enemies.set(enemy.id, {
            action: ActionType.None,
            isCompleted: false,
            isTimeout: false,
            startedAt: 0
        });
    }

    public static cleanUp(enemy: Enemy): void {
        EnemyAIService.enemies.delete(enemy.id);
    }
}