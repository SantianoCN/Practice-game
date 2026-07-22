import { IGameRepository } from '../interfaces/IGameRepository';
import { IPresetProvider } from '../interfaces/IPresetProvider';
import { IIdGenerator } from '../interfaces/IIdGenerator';
import { LootService } from '../../domain/services/LootService';
import { DroppedItem } from '../../domain/entities/Chest';

export class OpenChestUseCase {
    constructor(
        private gameRepo: IGameRepository,
        private presetProvider: IPresetProvider,
        private idGen: IIdGenerator
    ) {}

    public execute(sessionId: string, userId: string, chestId: string): boolean {
        const session = this.gameRepo.get(sessionId);
        if (!session) return false;

        const player = session.getPlayer(userId);
        if (!player || player.isDead()) return false;

        const room = session.getRoom(player.roomX, player.roomY);
        if (!room) return false;

        const chest = room.chests.find(c => c.id === chestId);
        if (!chest || chest.isOpened) return false;

        const chestPreset = this.presetProvider.getChestPreset(chest.presetId);
        if (!chestPreset) return false;

        const lootTable = this.presetProvider.getLootTable(chestPreset.lootTableId);
        if (!lootTable) return false;

        chest.open(chestPreset.visualIdOpened);

        const rolledLoots = LootService.rollLoot(lootTable, (id) => 
            this.presetProvider.getItemPreset(id)
        );

        for (const rolled of rolledLoots) {
            const itemId = this.idGen.generateId('item');
            const offsetX = (Math.random() - 0.5) * 30;
            const offsetY = (Math.random() - 0.5) * 30;

            const droppedItem = new DroppedItem(
                itemId,
                chest.x + offsetX,
                chest.y + offsetY,
                rolled.visualId,
                rolled.presetId,
                rolled.onPickup
            );

            room.droppedItems.push(droppedItem);
        }

        return true;
    }
}