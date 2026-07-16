import { IGameRepository } from '../interfaces/IGameRepository';
import { IClientBroadcaster } from '../interfaces/IClientBroadcaster';
import { CollisionEngine } from '../../domain/physics/CollisionEngine';
import { GameSnapshotDTO, RoomSnapshotDTO } from '@game/shared';
import { EnemyAIService } from '../../domain/services/EnemyAIService';
import { IIdGenerator } from '../interfaces/IIdGenerator';
import { RoomTransitionService } from '../../domain/services/RoomTransitionService';
import { Player } from '../../domain/entities/Player';
import { Room } from '../../domain/entities/Room';
import { GAME_CONFIG } from '../../domain/config/gameConfig';

export class GameTickUseCase {
    constructor(
        private repo: IGameRepository,
        private broadcaster: IClientBroadcaster,
        private idGen: IIdGenerator
    ) {}

    public execute(deltaTime: number, currentTime: number): void {
        const sessions = this.repo.getAll();

        for (const session of sessions) {
            
            for (const player of session.players.values()) {
                if (player.isDead()) continue;
                
                player.updateEntity(deltaTime);
                RoomTransitionService.handleTransition(
                    player,
                    Array.from(session.players.values()),
                    session.floorMap,
                    session.roomWidth,
                    session.roomHeight
                );
            }

            const activeRooms = new Set<Room>();
            
            for (const player of session.players.values()) {
                const room = session.getRoom(player.roomX, player.roomY);
                if (room) activeRooms.add(room);
            }
            
            for (let y = 0; y < session.floorMap.length; y++) {
                for (let x = 0; x < session.floorMap[y].length; x++) {
                    const room = session.floorMap[y][x];
                    if (room && room.bullets.length > 0) activeRooms.add(room);
                }
            }

            for (const room of activeRooms) {
                const playersInRoom = Array.from(session.players.values())
                    .filter(p => p.roomX === room.gridX && p.roomY === room.gridY);

                EnemyAIService.updateEnemies(
                    room.enemies, 
                    playersInRoom, 
                    room, 
                    deltaTime, 
                    currentTime, 
                    session.roomWidth, 
                    session.roomHeight,
                    (prefix) => this.idGen.generateId(prefix)
                );

                for (const player of playersInRoom) {
                    CollisionEngine.resolveWallBounds(player, session.roomWidth, session.roomHeight, room, true);
                    CollisionEngine.resolveObstacles(player, room.obstacles);
                    CollisionEngine.resolveChests(player, room.chests, room.droppedItems, GAME_CONFIG.CELL_SIZE, (prefix) => this.idGen.generateId(prefix));
                    CollisionEngine.resolveLootPickup(player, room.droppedItems);
                }

                for (const bullet of room.bullets) {
                    bullet.updatePosition(deltaTime);
                }

                CollisionEngine.resolveBulletEnvironment(room.bullets, room.obstacles, session.roomWidth, session.roomHeight);
                CollisionEngine.resolveBullets(room.bullets, room.enemies);
                CollisionEngine.resolveBullets(room.bullets, playersInRoom);
                
                room.checkClearCondition();
                room.cleanupDeadEntities();

                if (playersInRoom.length > 0) {
                    const snapshot = this.buildSnapshot(room, playersInRoom);
                    for (const player of playersInRoom) {
                        this.broadcaster.broadcastSnapshot(player.id, snapshot);
                    }
                }
            }
        }
    }

    private buildSnapshot(room: Room, players: Player[]): GameSnapshotDTO {
        const roomSnapshot: RoomSnapshotDTO = {
            gridX: room.gridX,
            gridY: room.gridY,
            isClear: room.isClear,
            type: room.type,
            hasDoors: room.hasDoors,
            obstacles: room.obstacles.map(o => ({ 
                id: o.id, x: o.x, y: o.y, width: o.width, height: o.height, sprite: o.sprite 
            })),
            chests: room.chests.map(c => ({ 
                id: c.id, x: c.x, y: c.y, width: c.width, height: c.height, sprite: 'chest', isOpened: c.isOpened, gridX: c.gridX, gridY: c.gridY 
            })),
            droppedItems: room.droppedItems.map(d => ({ 
                id: d.id, x: d.x, y: d.y, width: d.width, height: d.height, sprite: d.sprite 
            }))
        };

        return {
            room: roomSnapshot,
            players: players.map(p => ({
                id: p.id, x: p.x, y: p.y, width: p.width, height: p.height, sprite: p.sprite,
                hp: p.hp, maxHp: p.maxHp, mana: p.mana, maxMana: p.maxMana
            })),
            enemies: room.enemies.map(e => ({
                id: e.id, x: e.x, y: e.y, width: e.width, height: e.height, sprite: e.sprite,
                hp: e.hp, maxHp: e.maxHp
            })),
            bullets: room.bullets.map(b => ({
                id: b.id, x: b.x, y: b.y, width: b.width, height: b.height, sprite: b.sprite
            }))
        };
    }
}