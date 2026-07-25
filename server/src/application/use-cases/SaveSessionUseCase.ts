import { IGameRepository } from '../interfaces/IGameRepository';
import { ISaveRepository } from '../interfaces/ISaveRepository';

export class SaveSessionUseCase {
    constructor(
        private gameRepo: IGameRepository,
        private saveRepo: ISaveRepository
    ) {}

    public async execute(sessionId: string): Promise<boolean> {
        const session = this.gameRepo.get(sessionId);
        if (!session) return false;

        await this.saveRepo.saveRun(session);
        return true;
    }
}