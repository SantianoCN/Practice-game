import { IGameRepository } from '../interfaces/IGameRepository';
import { IClientBroadcaster } from '../interfaces/IClientBroadcaster';
import { CollisionEngine } from '../../domain/physics/CollisionEngine';
import { GameSnapshotDTO, RoomSnapshotDTO } from '@game/shared';
import { EnemyAIService } from '../../domain/services/EnemyAIService';
import { IIdGenerator } from '../interfaces/IIdGenerator';
import { GameSession } from '../state/GameSession';
import { Player } from '../../domain/entities/Player';


export class GameTickUseCase {
    constructor(
        private repo: IGameRepository,
        private broadcaster: IClientBroadcaster,
        private idGen: IIdGenerator
    ) {}

    public execute(deltaTime: number): void {
        const sessions = this.repo.getAll();

        for (const session of sessions) {
            for (const player of session.players.values()) {
                if (player.isDead()) continue;
                
                player.updateEntity(deltaTime);
                this.checkRoomTransition(session, player);
            }

            const activeRoomCoords = new Set<string>();
            for (const p of session.players.values()) {
                activeRoomCoords.add(`${p.roomX},${p.roomY}`);
            }

            for (const coords of activeRoomCoords) {
                const [rx, ry] = coords.split(',').map(Number);
                const room = session.getRoom(rx, ry);
                if (!room) continue;

                const playersInRoom = Array.from(session.players.values())
                    .filter(p => p.roomX === rx && p.roomY === ry);

                EnemyAIService.updateEnemies(room.enemies, playersInRoom);

                const now = performance.now();
                for (const enemy of room.enemies) {
                    if (enemy.isDead()) continue;
                    
                    enemy.updateEntity(deltaTime);
                    CollisionEngine.resolveWallBounds(enemy, session.roomWidth, session.roomHeight, room, false);
                    CollisionEngine.resolveObstacles(enemy, room.obstacles);

                    if (enemy.aiState === 'attack' && enemy.targetId) {
                        const target = session.getPlayer(enemy.targetId);
                        if (target && !target.isDead()) {
                            const dirX = target.x - enemy.x;
                            const dirY = target.y - enemy.y;
                            const dist = Math.hypot(dirX, dirY);

                            if (dist > 0) {
                                const bullet = enemy.currentWeapon.fire(
                                    this.idGen.generateId('bullet'),
                                    enemy.id,
                                    'enemy',
                                    enemy.x,
                                    enemy.y,
                                    dirX / dist, 
                                    dirY / dist,
                                    now
                                );
                                
                                if (bullet) {
                                    room.bullets.push(bullet);
                                }
                            }
                        }
                    }
                }

                for (const player of playersInRoom) {
                    CollisionEngine.resolveWallBounds(player, session.roomWidth, session.roomHeight, room, true);
                    CollisionEngine.resolveObstacles(player, room.obstacles);
                    CollisionEngine.resolveChests(player, room.chests, room.droppedItems, 20, this.idGen);
                    CollisionEngine.resolveLootPickup(player, room.droppedItems);
                }

                for (const bullet of room.bullets) {
                    bullet.updatePosition(deltaTime);
                }

                CollisionEngine.resolveBulletEnvironment(
                    room.bullets, 
                    room.obstacles, 
                    session.roomWidth, 
                    session.roomHeight
                );
                
                CollisionEngine.resolveBullets(room.bullets, room.enemies);
                CollisionEngine.resolveBullets(room.bullets, playersInRoom);
                
                room.checkClearCondition();
                room.cleanupDeadEntities();

                const snapshot = this.buildSnapshot(room, playersInRoom);
                for (const player of playersInRoom) {
                    this.broadcaster.broadcastSnapshot(player.id, snapshot);
                }
            }
        }
    }

    private checkRoomTransition(session: GameSession, player: Player): void {
        const padding = 15;
        const room = session.getRoom(player.roomX, player.roomY);
        
        if (!room || room.enemies.length > 0) return; 

        let nextX = player.roomX;
        let nextY = player.roomY;
        let spawnX = player.x;
        let spawnY = player.y;
        let isTransition = false;
        const bounds = player.getBounds();

        if (bounds.top < padding && 
            bounds.left < session.roomWidth / 2 + 50 && 
            bounds.right > session.roomWidth / 2 - 50 && 
            room.hasDoors.Top
        ) {
            nextY -= 1; 
            spawnY = session.roomHeight - player.height / 2 - padding; 
            isTransition = true;
        } else if (bounds.bottom > session.roomHeight - padding && 
            bounds.left < session.roomWidth / 2 + 50 && 
            bounds.right > session.roomWidth / 2 - 50 && 
            room.hasDoors.Bottom
        ) {
            nextY += 1; 
            spawnY = player.height / 2 + padding; 
            isTransition = true;
        } else if (bounds.left < padding && 
            bounds.top > session.roomHeight / 2 - 50 &&
            bounds.bottom < session.roomHeight / 2 + 50 &&
            room.hasDoors.Left
        ) {
            nextX -= 1; 
            spawnX = session.roomWidth - player.width / 2 - padding; 
            isTransition = true;
        } else if (bounds.right > session.roomWidth - padding && 
            bounds.top > session.roomHeight / 2 - 50 &&
            bounds.bottom < session.roomHeight / 2 + 50 &&
            room.hasDoors.Right
        ) {
            nextX += 1; 
            spawnX = player.width / 2 + padding; 
            isTransition = true;
        }

        if (isTransition) {
            const nextRoom = session.getRoom(nextX, nextY);
            
            if (nextRoom !== null) {
                player.roomX = nextX;
                player.roomY = nextY;
                player.x = spawnX;
                player.y = spawnY;
                player.vx = 0;
                player.vy = 0;
                if (nextRoom.type === 'Normal' && !nextRoom.isClear) {
                    
                    session.players.forEach((p) => {
                        if (p.id !== player.id && !p.isDead()) {
                            p.roomX = nextX;
                            p.roomY = nextY;
                            const offsetX = (Math.random() - 0.5) * 40; 
                            const offsetY = (Math.random() - 0.5) * 40;
                            p.x = spawnX + offsetX;
                            p.y = spawnY + offsetY;
                            p.vx = 0; 
                            p.vy = 0;
                        }
                    });
                }
            }
        }
    }

    private buildSnapshot(room: any, players: any[]): GameSnapshotDTO {
        const roomSnapshot: RoomSnapshotDTO = {
            gridX: room.gridX,
            gridY: room.gridY,
            isClear: room.isClear,
            type: room.type,
            hasDoors: room.hasDoors,
            obstacles: room.obstacles.map((o: any) => ({ ...o })),
            chests: room.chests.map((c: any) => ({ ...c })),
            droppedItems: room.droppedItems.map((d: any) => ({ ...d }))
        };

        return {
            room: roomSnapshot,
            players: players.map(p => ({
                id: p.id, x: p.x, y: p.y, width: p.width, height: p.height, sprite: p.sprite,
                hp: p.hp, maxHp: p.maxHp, mana: p.mana, maxMana: p.maxMana
            })),
            enemies: room.enemies.map((e: any) => ({
                id: e.id, x: e.x, y: e.y, width: e.width, height: e.height, sprite: e.sprite,
                hp: e.hp, maxHp: e.maxHp
            })),
            bullets: room.bullets.map((b: any) => ({
                id: b.id, x: b.x, y: b.y, width: b.width, height: b.height, sprite: b.sprite
            }))
        };
    }
}