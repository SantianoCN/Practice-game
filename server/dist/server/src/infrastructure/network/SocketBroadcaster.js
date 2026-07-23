"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketBroadcaster = void 0;
const shared_1 = require("@game/shared");
class SocketBroadcaster {
    io;
    constructor(io) {
        this.io = io;
    }
    broadcastSnapshot(userId, snapshot) {
        this.io.to(userId).emit(shared_1.ServerEvent.SNAPSHOT, snapshot);
    }
    broadcastError(userId, message) {
        this.io.to(userId).emit(shared_1.ServerEvent.ERROR, message);
    }
    broadcastRoomInit(userId, roomInit) {
        this.io.to(userId).emit('server:room-init', roomInit);
    }
}
exports.SocketBroadcaster = SocketBroadcaster;
