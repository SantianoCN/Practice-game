import { IGameRepository } from '../interfaces/IGameRepository';
import { IClientBroadcaster } from '../interfaces/IClientBroadcaster';
import { CollisionEngine } from '../../domain/physics/CollisionEngine';
import { GameSnapshotDTO, GameSnapshotSchema, GAME_CONFIG } from '@game/shared';
import { EnemyAIService } from '../../domain/services/EnemyAIService';
import { IIdGenerator } from '../interfaces/IIdGenerator';
import { RoomTransitionService } from '../../domain/services/RoomTransitionService';
import { Player } from '../../domain/entities/Player';
import { Room } from '../../domain/entities/Room';

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
        return GameSnapshotSchema.parse({
            room: room,
            players: players,
            enemies: room.enemies,
            bullets: room.bullets
        });
    }
}