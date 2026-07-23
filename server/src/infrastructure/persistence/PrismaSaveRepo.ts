import { PrismaClient } from '@prisma/client';
import { ISaveRepository } from '../../application/interfaces/ISaveRepository';
import { GameSession } from '../../domain/entities/GameSession';
import { Player } from '../../domain/entities/Player';
import { Weapon } from '../../domain/entities/Weapon';
import { ITEMS_DATABASE, SWORD, PLAYER_CLASSES, GAME_DIFFICULTY } from '@game/shared';

export class PrismaSaveRepo implements ISaveRepository {
    constructor(private prisma: PrismaClient) {}

    private readonly includeConfig = {
        players: {
            include: {
                inventory: true
            }
        }
    };

    public async saveRun(session: GameSession): Promise<void> {
        await this.prisma.runSave.deleteMany({
            where: {
                OR: [
                    { sessionId: session.sessionId },
                    { hostLogin: session.hostLogin }
                ]
            }
        });

        const playersData = Array.from(session.players.values()).map(p => {
            const activeWeapon = p.getActiveWeapon();
            
            const inventoryItems = p.inventory.map(w => ({
                itemId: w.presetId,
                quantity: 1
            }));

            return {
                login: p.name,
                archetype: p.archetype,
                hp: p.hp,
                maxHp: p.maxHp,
                mana: p.mana,
                maxMana: p.maxMana,
                gold: p.gold,
                weaponPresetId: activeWeapon.presetId,
                inventory: {
                    create: inventoryItems
                }
            };
        });

        await this.prisma.runSave.create({
            data: {
                sessionId: session.sessionId,
                hostLogin: session.hostLogin,
                floorNumber: session.difficulty.levelNumber || 1,
                roomWidth: session.roomWidth,
                roomHeight: session.roomHeight,
                players: {
                    create: playersData
                }
            }
        });
    }

    public async loadRun(sessionId: string): Promise<GameSession | null> {
        const dbSave = await this.prisma.runSave.findUnique({
            where: { sessionId },
            include: this.includeConfig
        });

        if (!dbSave) return null;

        const difficultyKey = `LVL${dbSave.floorNumber}`;
        const difficulty = GAME_DIFFICULTY[difficultyKey] || { levelNumber: dbSave.floorNumber, ROOM_COUNT: 10 };

        const session = new GameSession(dbSave.sessionId, dbSave.roomWidth, dbSave.roomHeight, difficulty);
        session.hostLogin = dbSave.hostLogin;

        for (const dbPlayer of dbSave.players) {
            session.allowedLogins.add(dbPlayer.login);

            const weaponPresets = dbPlayer.inventory.length > 0
                ? dbPlayer.inventory.map((item: any) => item.itemId)
                : ['wpn_iron_sword'];
                
            const weapons: Weapon[] = [];

            for (let i = 0; i < weaponPresets.length; i++) {
                const presetId = weaponPresets[i];
                const item = ITEMS_DATABASE[presetId];
                const config = (item && item.type === 'weapon' && item.stats) ? item.stats : SWORD;
                const name = item ? item.name : 'Стальной Меч';

                weapons.push(new Weapon(`wpn_restored_${dbPlayer.login}_${i}`, presetId, name, config));
            }

            const classPreset = PLAYER_CLASSES[dbPlayer.archetype] || PLAYER_CLASSES['warrior'];
            const stats = classPreset.stats;

            const player = new Player(
                `restored_offline_${dbPlayer.login}`,
                dbPlayer.login,
                dbSave.roomWidth / 2,
                dbSave.roomHeight / 2,
                stats,
                weapons[0],
                dbPlayer.mana,
                dbPlayer.maxMana,
                stats.manaRegen
            );

            player.hp = dbPlayer.hp;
            player.maxHp = dbPlayer.maxHp;
            player.gold = dbPlayer.gold;
            player.inventory = weapons;
            player.isOnline = false;

            const activeIndex = weapons.findIndex(w => w.presetId === dbPlayer.weaponPresetId);
            if (activeIndex !== -1) {
                player.currentWeaponIndex = activeIndex;
            }

            session.addPlayer(player);
        }

        return session;
    }

    public async deleteRun(sessionId: string): Promise<void> {
        try {
            await this.prisma.runSave.delete({ where: { sessionId } });
        } catch (err) {
            
        }
    }

    public async getRunSaveByHost(hostLogin: string): Promise<any | null> {
        return this.prisma.runSave.findFirst({
            where: { hostLogin },
            include: this.includeConfig,
            orderBy: { createdAt: 'desc' }
        });
    }
}