import { IAccountRepository } from '../interfaces/IAccountRepository';
import { PlayerProgress } from '../../domain/entities/PlayerProgress';
import { PLAYER_CLASSES, SHOP_PRICES } from '@game/shared';

export class BuyItemUseCase {
    constructor(private accountRepo: IAccountRepository) {}

    public async execute(login: string, itemPresetId: string): Promise<PlayerProgress | null> {
        const account = await this.accountRepo.getByLogin(login);
        if (!account || !account.progress) return null;

        const price = SHOP_PRICES[itemPresetId];
        if (price === undefined) return null;

        const progress = account.progress;

        if (progress.metaGold < price) return null;

        const updatedClasses = [...progress.unlockedClasses];
        const updatedWeapons = [...progress.unlockedWeapons];

        const isClass = itemPresetId in PLAYER_CLASSES;

        if (isClass) {
            if (updatedClasses.includes(itemPresetId)) return null; 
            updatedClasses.push(itemPresetId);
        } else {
            if (updatedWeapons.includes(itemPresetId)) return null; 
            updatedWeapons.push(itemPresetId);
        }

        const updatedAccount = await this.accountRepo.updateProgress(
            account.id,
            progress.metaGold - price,
            updatedClasses,
            updatedWeapons
        );

        return updatedAccount.progress || null;
    }
}