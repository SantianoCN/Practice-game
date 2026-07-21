import { PrismaClient } from '@prisma/client';
import { IAccountRepository } from '../../application/interfaces/IAccountRepository';
import { Account } from '../../domain/entities/Account';
import { PlayerProgress } from '../../domain/entities/PlayerProgress';

export class PrismaAccountRepo implements IAccountRepository {
    constructor(private prisma: PrismaClient) {}

    private mapToDomain(dbAccount: any): Account {
        let domainProgress: PlayerProgress | undefined;

        if (dbAccount.progress) {
            domainProgress = new PlayerProgress(
                dbAccount.progress.metaGold,
                dbAccount.progress.unlockedClasses ? dbAccount.progress.unlockedClasses.split(',') : ['warrior'],
                dbAccount.progress.unlockedWeapons ? dbAccount.progress.unlockedWeapons.split(',') : ['wpn_iron_sword']
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
            include: { progress: true }
        });
        if (!dbAccount) return null;
        return this.mapToDomain(dbAccount);
    }

    async getByToken(token: string): Promise<Account | null> {
        const dbAccount = await this.prisma.account.findFirst({ 
            where: { refreshToken: token },
            include: { progress: true }
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
                        metaGold: 0,
                        unlockedClasses: "warrior",
                        unlockedWeapons: "wpn_iron_sword"
                    }
                }
            },
            include: { progress: true }
        });
        return this.mapToDomain(dbAccount);
    }

    async updateToken(id: string, token: string): Promise<Account> {
        const dbAccount = await this.prisma.account.update({
            where: { id },
            data: { refreshToken: token },
            include: { progress: true }
        });
        return this.mapToDomain(dbAccount);
    }

    // ШАГ 4: Запись обновленного прогресса в БД
    async updateProgress(
        accountId: string, 
        metaGold: number, 
        unlockedClasses: string[], 
        unlockedWeapons: string[]
    ): Promise<Account> {
        const dbAccount = await this.prisma.account.update({
            where: { id: accountId },
            data: {
                progress: {
                    update: {
                        metaGold,
                        // Склеиваем массивы обратно в плоские строки для SQLite
                        unlockedClasses: unlockedClasses.join(','),
                        unlockedWeapons: unlockedWeapons.join(',')
                    }
                }
            },
            include: { progress: true }
        });
        return this.mapToDomain(dbAccount);
    }
}