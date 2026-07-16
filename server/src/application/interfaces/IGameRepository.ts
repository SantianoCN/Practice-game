import { GameSession } from '../state/GameSession';

export interface IGameRepository {
    save(session: GameSession): void;
    get(sessionId: string): GameSession | undefined;
    delete(sessionId: string): void;
    getAll(): GameSession[];
}