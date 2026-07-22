"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManagementUseCase = void 0;
const GameSession_1 = require("../../domain/entities/GameSession");
const EntityFactory_1 = require("../../domain/factories/EntityFactory");
const FloorGenerator_1 = require("../../domain/world/FloorGenerator");
const Room_1 = require("../../domain/entities/Room");
const shared_1 = require("@game/shared");
class SessionManagementUseCase {
    repo;
    idGen;
    presetProvider;
    roomWidth;
    roomHeight;
    deleteTimers = new Map();
    constructor(repo, idGen, presetProvider, roomWidth, roomHeight) {
        this.repo = repo;
        this.idGen = idGen;
        this.presetProvider = presetProvider;
        this.roomWidth = roomWidth;
        this.roomHeight = roomHeight;
    }
    addPlayerToSession(session, userId, login, archetype, weaponId) {
        const pendingTimer = this.deleteTimers.get(session.sessionId);
        if (pendingTimer) {
            clearTimeout(pendingTimer);
            this.deleteTimers.delete(session.sessionId);
        }
        const player = EntityFactory_1.EntityFactory.createPlayer(userId, login, archetype, weaponId, session.roomWidth / 2, session.roomHeight / 2, (prefix) => this.idGen.generateId(prefix));
        player.roomX = Math.floor(shared_1.GAME_CONFIG.MAP_SIZE / 2);
        player.roomY = Math.floor(shared_1.GAME_CONFIG.MAP_SIZE / 2);
        session.addPlayer(player);
    }
    createSession(userId, login, archetype, weaponId) {
        const sessionId = this.idGen.generateUUID('session');
        const session = new GameSession_1.GameSession(sessionId, this.roomWidth, this.roomHeight);
        session.isLobby = false;
        const mapGenerator = new FloorGenerator_1.MapGenerator(shared_1.GAME_CONFIG.MAP_SIZE, 15, this.roomWidth, this.roomHeight, (prefix) => this.idGen.generateId(prefix), (id) => this.presetProvider.getChestPreset(id));
        session.floorMap = mapGenerator.generate();
        this.repo.save(session);
        this.addPlayerToSession(session, userId, login, archetype, weaponId);
        return sessionId;
    }
    createLobby(userId, login, archetype, weaponId) {
        const sessionId = this.idGen.generateUUID('session');
        const session = new GameSession_1.GameSession(sessionId, this.roomWidth, this.roomHeight);
        session.isLobby = true;
        session.hostId = userId;
        session.floorMap = Array(shared_1.GAME_CONFIG.MAP_SIZE).fill(null).map(() => Array(shared_1.GAME_CONFIG.MAP_SIZE).fill(null));
        const startX = Math.floor(shared_1.GAME_CONFIG.MAP_SIZE / 2);
        const startY = Math.floor(shared_1.GAME_CONFIG.MAP_SIZE / 2);
        const lobbyRoom = new Room_1.Room(startX, startY, 'Start', 0);
        lobbyRoom.isClear = true;
        lobbyRoom.hasDoors = { Top: false, Bottom: false, Left: false, Right: false };
        session.floorMap[startY][startX] = lobbyRoom;
        this.repo.save(session);
        this.addPlayerToSession(session, userId, login, archetype, weaponId);
        return sessionId;
    }
    joinLobby(sessionId, userId, login, archetype, weaponId) {
        const session = this.repo.get(sessionId);
        if (!session)
            return false;
        if (!session.isLobby) {
            console.log(`[Security Action] Попытка несанкционированного входа в уже активный бой: ${sessionId}`);
            return false;
        }
        this.addPlayerToSession(session, userId, login, archetype, weaponId);
        return true;
    }
    startMatch(sessionId, userId) {
        const session = this.repo.get(sessionId);
        if (!session || !session.isLobby)
            return false;
        if (session.hostId !== userId)
            return false;
        const mapGenerator = new FloorGenerator_1.MapGenerator(shared_1.GAME_CONFIG.MAP_SIZE, 15, session.roomWidth, session.roomHeight, (prefix) => this.idGen.generateId(prefix), (id) => this.presetProvider.getChestPreset(id));
        session.floorMap = mapGenerator.generate();
        session.isLobby = false;
        const startX = Math.floor(shared_1.GAME_CONFIG.MAP_SIZE / 2);
        const startY = Math.floor(shared_1.GAME_CONFIG.MAP_SIZE / 2);
        for (const player of session.players.values()) {
            player.roomX = startX;
            player.roomY = startY;
            player.x = session.roomWidth / 2;
            player.y = session.roomHeight / 2;
            player.vx = 0;
            player.vy = 0;
        }
        return true;
    }
    leaveSession(sessionId, userId) {
        const session = this.repo.get(sessionId);
        if (!session)
            return;
        session.removePlayer(userId);
        if (session.isEmpty()) {
            if (!this.deleteTimers.has(sessionId)) {
                const GRACE_PERIOD_MS = 15000;
                const timer = setTimeout(() => {
                    this.repo.delete(sessionId);
                    this.deleteTimers.delete(sessionId);
                }, GRACE_PERIOD_MS);
                this.deleteTimers.set(sessionId, timer);
            }
        }
    }
}
exports.SessionManagementUseCase = SessionManagementUseCase;
