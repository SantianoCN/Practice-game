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

        const oldSave = await this.saveRepo.loadRun(sessionId);

        if (oldSave) {
            for (const oldPlayer of oldSave.players.values()) {
                const isCurrentlyPlaying = Array.from(session.players.values())
                    .some(p => p.name === oldPlayer.name);

                const isStillAllowed = session.allowedLogins.has(oldPlayer.name);

                if (!isCurrentlyPlaying && isStillAllowed) {
                    oldPlayer.isOnline = false;
                    session.addPlayer(oldPlayer);
                }
            }
        }

        await this.saveRepo.saveRun(session);
        return true;
    }
}