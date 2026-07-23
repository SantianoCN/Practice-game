"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameSession = void 0;
class GameSession {
    sessionId;
    roomWidth;
    roomHeight;
    players = new Map();
    floorMap = [];
    isLobby = false;
    hostId = '';
    constructor(sessionId, roomWidth, roomHeight) {
        this.sessionId = sessionId;
        this.roomWidth = roomWidth;
        this.roomHeight = roomHeight;
    }
    getPlayer(userId) {
        return this.players.get(userId);
    }
    addPlayer(player) {
        this.players.set(player.id, player);
    }
    removePlayer(userId) {
        this.players.delete(userId);
    }
    getRoom(x, y) {
        if (y < 0 || y >= this.floorMap.length)
            return null;
        if (x < 0 || x >= this.floorMap[y].length)
            return null;
        return this.floorMap[y][x];
    }
    isEmpty() {
        return this.players.size === 0;
    }
}
exports.GameSession = GameSession;
