import { IGameRepository } from '../../application/interfaces/IGameRepository';
import { GameSession } from '../../application/state/GameSession';

export class InMemoryGameRepo implements IGameRepository {
    private sessions: Map<string, GameSession> = new Map();

    public save(session: GameSession): void {
        this.sessions.set(session.sessionId, session);
    }

    public get(sessionId: string): GameSession | undefined {
        return this.sessions.get(sessionId);
    }

    public delete(sessionId: string): void {
        this.sessions.delete(sessionId);
    }

    public getAll(): GameSession[] {
        return Array.from(this.sessions.values());
    }
}