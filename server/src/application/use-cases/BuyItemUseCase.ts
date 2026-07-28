import { IAccountRepository } from '../interfaces/IAccountRepository';
import { PlayerProgress } from '../../domain/entities/PlayerProgress';
import { PLAYER_CLASSES, SHOP_PRICES, ITEMS_DATABASE } from '@game/shared';

export class BuyItemUseCase {
    constructor(private accountRepo: IAccountRepository) {}

    public async execute(accountId: string, itemPresetId: string): Promise<PlayerProgress | null> {
        const account = await this.accountRepo.getById(accountId);
        if (!account || !account.progress) return null;

        const price = SHOP_PRICES[itemPresetId];
        if (price === undefined) return null;

        const progress = account.progress;

        if (progress.gold < price) return null;

        const updatedClasses = [...progress.unlockedClasses];
        const updatedWeapons = [...progress.unlockedWeapons];

        let category: 'class' | 'weapon' | 'unknown' = 'unknown';

        if (itemPresetId in PLAYER_CLASSES) {
            category = 'class';
        } else if (itemPresetId in ITEMS_DATABASE) {
            category = 'weapon';
        }

        switch (category) {
            case 'class':
                if (updatedClasses.includes(itemPresetId)) return null;
                updatedClasses.push(itemPresetId);
                break;

            case 'weapon':
                if (updatedWeapons.includes(itemPresetId)) return null;
                updatedWeapons.push(itemPresetId);
                break;

            case 'unknown':
            default:
                return null;
        }

        const updatedAccount = await this.accountRepo.updateProgress(
            account.id,
            progress.gold - price,
            updatedClasses,
            updatedWeapons
        );

        return updatedAccount.progress || null;
    }
}