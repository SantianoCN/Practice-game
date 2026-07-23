"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryGameRepo = void 0;
class InMemoryGameRepo {
    sessions = new Map();
    save(session) {
        this.sessions.set(session.sessionId, session);
    }
    get(sessionId) {
        return this.sessions.get(sessionId);
    }
    delete(sessionId) {
        this.sessions.delete(sessionId);
    }
    getAll() {
        return Array.from(this.sessions.values());
    }
}
exports.InMemoryGameRepo = InMemoryGameRepo;
