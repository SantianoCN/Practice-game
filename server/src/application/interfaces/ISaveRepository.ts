import { GameSession } from '../../domain/entities/GameSession';

export interface ISaveRepository {
    saveRun(session: GameSession): Promise<void>;
    loadRun(saveId: string): Promise<GameSession | null>;
    deleteRun(saveId: string): Promise<void>;
    getRunSaveByHostAccountId(hostAccountId: string): Promise<any | null>;
}