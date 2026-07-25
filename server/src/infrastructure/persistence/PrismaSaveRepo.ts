import { PrismaClient } from '@prisma/client';
import { ISaveRepository } from '../../application/interfaces/ISaveRepository';
import { GameSession } from '../../domain/entities/GameSession';
import { Player } from '../../domain/entities/Player';
import { Weapon } from '../../domain/entities/Weapon';
import { ITEMS_DATABASE, SWORD, PLAYER_CLASSES, GAME_DIFFICULTY } from '@game/shared';

export class PrismaSaveRepo implements ISaveRepository {
    constructor(private prisma: PrismaClient) {}

    private readonly includeConfig = {
        host: true,
        players: {
            include: {
                account: true,
                inventory: true
            }
        }
    };

    public async saveRun(session: GameSession): Promise<void> {
        await this.prisma.runSave.deleteMany({
            where: { hostAccountId: session.hostAccountId }
        });

        const playersData = Array.from(session.players.values()).map(p => {
            const inventoryItems = p.inventory.map(w => ({
                itemId: w.presetId
            }));

            return {
                accountId: p.id,
                archetype: p.archetype,
                gold: p.gold,
                inventory: {
                    create: inventoryItems
                }
            };
        });

        await this.prisma.runSave.create({
            data: {
                hostAccountId: session.hostAccountId,
                isSingleplayer: session.isSingleplayer,
                floorNumber: session.difficulty.levelNumber || 1,
                roomWidth: session.roomWidth,
                roomHeight: session.roomHeight,
                players: {
                    create: playersData
                }
            }
        });
    }

    public async loadRun(saveId: string): Promise<GameSession | null> {
        const dbSave = await this.prisma.runSave.findUnique({
            where: { id: saveId },
            include: this.includeConfig
        });

        if (!dbSave) return null;

        const difficultyKey = `LVL${dbSave.floorNumber}`;
        const difficulty = GAME_DIFFICULTY[difficultyKey] || { levelNumber: dbSave.floorNumber, ROOM_COUNT: 10 };

        const session = new GameSession(dbSave.id, dbSave.roomWidth, dbSave.roomHeight, difficulty);
        session.hostAccountId = dbSave.hostAccountId;
        session.isSingleplayer = dbSave.isSingleplayer;

        for (const dbPlayer of dbSave.players) {
            const accountId = dbPlayer.accountId;
            const login = dbPlayer.account.login;

            session.allowedAccountIds.add(accountId);

            const weaponPresets = dbPlayer.inventory.length > 0
                ? dbPlayer.inventory.map((item: any) => item.itemId)
                : ['wpn_iron_sword'];

            const weapons: Weapon[] = [];

            for (let i = 0; i < weaponPresets.length; i++) {
                const presetId = weaponPresets[i];
                const item = ITEMS_DATABASE[presetId];
                const config = (item && item.type === 'weapon' && item.stats) ? item.stats : SWORD;
                const name = item ? item.name : 'Стальной Меч';

                weapons.push(new Weapon(`wpn_restored_${accountId}_${i}`, presetId, name, config));
            }

            const classPreset = PLAYER_CLASSES[dbPlayer.archetype] || PLAYER_CLASSES['warrior'];
            const stats = classPreset.stats;

            const player = new Player(
                accountId,
                login,
                dbSave.roomWidth / 2,
                dbSave.roomHeight / 2,
                stats,
                weapons[0],
                stats.maxMana,
                stats.maxMana,
                stats.manaRegen
            );

            player.gold = dbPlayer.gold;
            player.inventory = weapons;
            player.isOnline = false;

            session.addPlayer(player);
        }

        return session;
    }

    public async deleteRun(saveId: string): Promise<void> {
        try {
            await this.prisma.runSave.delete({ where: { id: saveId } });
        } catch (err) {}
    }

    public async getRunSaveByHostAccountId(hostAccountId: string): Promise<any | null> {
        return this.prisma.runSave.findUnique({
            where: { hostAccountId },
            include: this.includeConfig
        });
    }
}