"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenChestUseCase = void 0;
const LootService_1 = require("../../domain/services/LootService");
const Chest_1 = require("../../domain/entities/Chest");
class OpenChestUseCase {
    gameRepo;
    presetProvider;
    idGen;
    constructor(gameRepo, presetProvider, idGen) {
        this.gameRepo = gameRepo;
        this.presetProvider = presetProvider;
        this.idGen = idGen;
    }
    execute(sessionId, userId, chestId) {
        const session = this.gameRepo.get(sessionId);
        if (!session)
            return false;
        const player = session.getPlayer(userId);
        if (!player || player.isDead())
            return false;
        const room = session.getRoom(player.roomX, player.roomY);
        if (!room)
            return false;
        const chest = room.chests.find(c => c.id === chestId);
        if (!chest || chest.isOpened)
            return false;
        const chestPreset = this.presetProvider.getChestPreset(chest.presetId);
        if (!chestPreset)
            return false;
        const lootTable = this.presetProvider.getLootTable(chestPreset.lootTableId);
        if (!lootTable)
            return false;
        chest.open(chestPreset.visualIdOpened);
        // Роллим лут в виде плоских эффектов
        const rolledLoots = LootService_1.LootService.rollLoot(lootTable, (id) => this.presetProvider.getItemPreset(id));
        for (const rolled of rolledLoots) {
            const itemId = this.idGen.generateId('item');
            const offsetX = (Math.random() - 0.5) * 30;
            const offsetY = (Math.random() - 0.5) * 30;
            const droppedItem = new Chest_1.DroppedItem(itemId, chest.x + offsetX, chest.y + offsetY, rolled.visualId, rolled.presetId, rolled.onPickup);
            room.droppedItems.push(droppedItem);
        }
        return true;
    }
}
exports.OpenChestUseCase = OpenChestUseCase;
