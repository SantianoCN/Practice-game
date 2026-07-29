import { PrismaClient } from '@prisma/client';
import { IAccountRepository } from '../../application/interfaces/IAccountRepository';
import { Account } from '../../domain/entities/Account';
import { PlayerProgress } from '../../domain/entities/PlayerProgress';

export class PrismaAccountRepo implements IAccountRepository {
    constructor(private prisma: PrismaClient) {}

    private readonly includeConfig = {
        progress: {
            include: {
                unlockedClasses: true,
                unlockedWeapons: true
            }
        }
    };

    private mapToDomain(dbAccount: any): Account {
        let domainProgress: PlayerProgress | undefined;

        if (dbAccount.progress) {
            const classes = dbAccount.progress.unlockedClasses
                ? dbAccount.progress.unlockedClasses.map((c: any) => c.classId)
                : ['warrior'];

            const weapons = dbAccount.progress.unlockedWeapons
                ? dbAccount.progress.unlockedWeapons.map((w: any) => w.weaponId)
                : ['wpn_iron_sword'];

            domainProgress = new PlayerProgress(
                dbAccount.progress.gold,
                classes,
                weapons
            );
        }

        return new Account(
            dbAccount.id, 
            dbAccount.login, 
            dbAccount.passwordHash, 
            dbAccount.refreshToken,
            domainProgress
        );
    }

    async getByLogin(login: string): Promise<Account | null> {
        const dbAccount = await this.prisma.account.findFirst({ 
            where: { login },
            include: this.includeConfig
        });
        if (!dbAccount) return null;
        return this.mapToDomain(dbAccount);
    }

    async getById(accountId: string): Promise<Account | null> {
        const dbAccount = await this.prisma.account.findUnique({ 
            where: { id: accountId },
            include: this.includeConfig
        });
        
        if (!dbAccount) return null;
        return this.mapToDomain(dbAccount);
    }

    async getByToken(token: string): Promise<Account | null> {
        if (!token) return null;
        const dbAccount = await this.prisma.account.findFirst({ 
            where: { refreshToken: token },
            include: this.includeConfig
        });
        if (!dbAccount) return null;
        return this.mapToDomain(dbAccount);
    }

    async create(login: string, passwordHash: string, token: string): Promise<Account> {
        const dbAccount = await this.prisma.account.create({
            data: { 
                login, 
                passwordHash, 
                refreshToken: token,
                progress: {
                    create: {
                        gold: 0,
                        unlockedClasses: {
                            create: { classId: "warrior" }
                        },
                        unlockedWeapons: {
                            create: { weaponId: "wpn_iron_sword" }
                        }
                    }
                }
            },
            include: this.includeConfig
        });
        return this.mapToDomain(dbAccount);
    }

    async updateToken(id: string, token: string): Promise<Account> {
        const dbAccount = await this.prisma.account.update({
            where: { id },
            data: { refreshToken: token },
            include: this.includeConfig
        });
        return this.mapToDomain(dbAccount);
    }

    async updateProgress(
        accountId: string, 
        gold: number, 
        unlockedClasses: string[], 
        unlockedWeapons: string[]
    ): Promise<Account> {
        const account = await this.prisma.account.findUnique({
            where: { id: accountId },
            include: this.includeConfig
        });

        if (!account || !account.progress) {
            throw new Error("Прогресс аккаунта не найден в базе данных");
        }

        const progressId = account.progress.id;

        const existingClasses = new Set(
            account.progress.unlockedClasses
                ? account.progress.unlockedClasses.map((c: any) => c.classId)
                : []
        );
        const existingWeapons = new Set(
            account.progress.unlockedWeapons
                ? account.progress.unlockedWeapons.map((w: any) => w.weaponId)
                : []
        );

        const newClasses = unlockedClasses.filter(c => !existingClasses.has(c));
        const newWeapons = unlockedWeapons.filter(w => !existingWeapons.has(w));

        const transactions: any[] = [
            this.prisma.playerProgress.update({
                where: { id: progressId },
                data: { gold }
            })
        ];

        if (newClasses.length > 0) {
            transactions.push(
                this.prisma.unlockedClass.createMany({
                    data: newClasses.map(c => ({ playerProgressId: progressId, classId: c }))
                })
            );
        }

        if (newWeapons.length > 0) {
            transactions.push(
                this.prisma.unlockedWeapon.createMany({
                    data: newWeapons.map(w => ({ playerProgressId: progressId, weaponId: w }))
                })
            );
        }

        await this.prisma.$transaction(transactions);

        const updatedAccount = await this.prisma.account.findUnique({
            where: { id: accountId },
            include: this.includeConfig
        });

        if (!updatedAccount) {
            throw new Error("Не удалось получить обновленный аккаунт");
        }

        return this.mapToDomain(updatedAccount);
    }
}