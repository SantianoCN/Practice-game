import { GameSession } from '../../domain/entities/GameSession';

export interface ISaveRepository {
    saveRun(session: GameSession): Promise<void>;
    loadRun(sessionId: string): Promise<GameSession | null>;
    deleteRun(sessionId: string): Promise<void>;
    getRunSaveByHost(hostLogin: string): Promise<any | null>;
}