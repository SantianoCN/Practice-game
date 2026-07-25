import { IGameRepository } from '../interfaces/IGameRepository';
import { IAccountRepository } from '../interfaces/IAccountRepository';
import { PlayerProgress } from '../../domain/entities/PlayerProgress';

export class CompleteSessionUseCase {
    constructor(
        private gameRepo: IGameRepository,
        private accountRepo: IAccountRepository
    ) {}

    public async execute(sessionId: string, accountId: string): Promise<PlayerProgress | null> {
        const session = this.gameRepo.get(sessionId);
        if (!session) return null;

        const player = session.getPlayer(accountId);
        if (!player) return null;

        const runGold = player.getGoldCount();

        const account = await this.accountRepo.getById(accountId);
        if (!account || !account.progress) return null;

        const progress = account.progress;

        const updatedAccount = await this.accountRepo.updateProgress(
            account.id,
            progress.gold + runGold,
            progress.unlockedClasses,
            progress.unlockedWeapons
        );

        return updatedAccount.progress || null;
    }
}