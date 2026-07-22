"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameTickUseCase = void 0;
const CollisionEngine_1 = require("../../domain/physics/CollisionEngine");
const shared_1 = require("@game/shared");
const EnemyAIService_1 = require("../../domain/services/EnemyAIService");
const PlayerCombatService_1 = require("../../domain/services/PlayerCombatService");
const RoomTransitionService_1 = require("../../domain/services/RoomTransitionService");
const Chest_1 = require("../../domain/entities/Chest");
const EffectApplier_1 = require("../../domain/services/EffectApplier");
class GameTickUseCase {
    repo;
    broadcaster;
    idGen;
    openChestUseCase;
    presetProvider;
    constructor(repo, broadcaster, idGen, openChestUseCase, presetProvider) {
        this.repo = repo;
        this.broadcaster = broadcaster;
        this.idGen = idGen;
        this.openChestUseCase = openChestUseCase;
        this.presetProvider = presetProvider;
    }
    execute(deltaTime, currentTime) {
        const sessions = this.repo.getAll();
        for (const session of sessions) {
            for (const player of session.players.values()) {
                if (player.isDead())
                    continue;
                player.processInputQueue();
                player.applyInputFromHeldKeys();
                const room = session.getRoom(player.roomX, player.roomY);
                if (room) {
                    const bullet = PlayerCombatService_1.PlayerCombatService.handleAttack(player, room, currentTime, () => this.idGen.generateId('bullet'));
                    if (bullet) {
                        room.bullets.push(bullet);
                    }
                }
                player.updateEntity(deltaTime);
                if (!session.isLobby) {
                    RoomTransitionService_1.RoomTransitionService.handleTransition(player, Array.from(session.players.values()), session.floorMap, session.roomWidth, session.roomHeight);
                }
                const currentRoom = session.getRoom(player.roomX, player.roomY);
                if (currentRoom && (player.lastBroadcastedRoomX !== player.roomX || player.lastBroadcastedRoomY !== player.roomY)) {
                    player.lastBroadcastedRoomX = player.roomX;
                    player.lastBroadcastedRoomY = player.roomY;
                    const roomInit = shared_1.RoomInitSchema.parse({
                        gridX: currentRoom.gridX,
                        gridY: currentRoom.gridY,
                        type: currentRoom.type,
                        obstacles: currentRoom.obstacles
                    });
                    this.broadcaster.broadcastRoomInit(player.id, roomInit);
                }
            }
            const activeRooms = new Set();
            for (const player of session.players.values()) {
                const room = session.getRoom(player.roomX, player.roomY);
                if (room)
                    activeRooms.add(room);
            }
            for (let y = 0; y < session.floorMap.length; y++) {
                for (let x = 0; x < session.floorMap[y].length; x++) {
                    const room = session.floorMap[y][x];
                    if (room && room.bullets.length > 0)
                        activeRooms.add(room);
                }
            }
            for (const room of activeRooms) {
                const playersInRoom = Array.from(session.players.values())
                    .filter(p => p.roomX === room.gridX && p.roomY === room.gridY);
                if (!session.isLobby) {
                    EnemyAIService_1.EnemyAIService.updateEnemies(room.enemies, playersInRoom, room, deltaTime, currentTime, session.roomWidth, session.roomHeight, (prefix) => this.idGen.generateId(prefix));
                }
                for (const player of playersInRoom) {
                    CollisionEngine_1.CollisionEngine.resolveWallBounds(player, session.roomWidth, session.roomHeight, room, true);
                    CollisionEngine_1.CollisionEngine.resolveObstacles(player, room.getObstacleGrid());
                    const interactedChestId = CollisionEngine_1.CollisionEngine.checkChestInteraction(player, room.chests);
                    if (interactedChestId) {
                        this.openChestUseCase.execute(session.sessionId, player.id, interactedChestId);
                    }
                    const pickedItems = CollisionEngine_1.CollisionEngine.resolveLootPickup(player, room.droppedItems);
                    // 2. Доменный обработчик поочередно применяет эффекты из коробки к игроку
                    for (const item of pickedItems) {
                        for (const effect of item.onPickup) {
                            // Вызываем чистую функцию без громоздких коллбэков
                            const result = EffectApplier_1.EffectApplier.apply(effect, player, (presetId) => this.presetProvider.getItemPreset(presetId), () => this.idGen.generateId('wpn'));
                            if (result && result.droppedWeapon) {
                                const droppedWeapon = result.droppedWeapon;
                                const replacementItem = new Chest_1.DroppedItem(this.idGen.generateId('item'), player.x, player.y, droppedWeapon.config.visualId, droppedWeapon.presetId, [{ type: 'equip_weapon', weaponPresetId: droppedWeapon.presetId }]);
                                room.droppedItems.push(replacementItem);
                            }
                        }
                    }
                }
                for (const bullet of room.bullets) {
                    bullet.updatePosition(deltaTime);
                }
                CollisionEngine_1.CollisionEngine.resolveBulletEnvironment(room.bullets, room.getObstacleGrid(), session.roomWidth, session.roomHeight);
                CollisionEngine_1.CollisionEngine.resolveBullets(room.bullets, room.enemies);
                CollisionEngine_1.CollisionEngine.resolveBullets(room.bullets, playersInRoom);
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
    buildSnapshot(room, players) {
        return shared_1.GameSnapshotSchema.parse({
            room: room,
            players: players,
            enemies: room.enemies,
            bullets: room.bullets
        });
    }
}
exports.GameTickUseCase = GameTickUseCase;
