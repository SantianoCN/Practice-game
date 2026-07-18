import { PrismaClient } from '@prisma/client';
import { IAccountRepository } from '../../application/interfaces/IAccountRepository';
import { Account } from '../../domain/entities/Account';

export class PrismaAccountRepo implements IAccountRepository {
    constructor(private prisma: PrismaClient) {}

    async getByLogin(login: string): Promise<Account | null> {
        const dbAccount = await this.prisma.account.findFirst({ where: { login } });
        if (!dbAccount) return null;
        return new Account(dbAccount.id, dbAccount.login, dbAccount.passwordHash, dbAccount.refreshToken);
    }

    async getByToken(token: string): Promise<Account | null> {
        const dbAccount = await this.prisma.account.findFirst({ where: { refreshToken: token } });
        if (!dbAccount) return null;
        return new Account(dbAccount.id, dbAccount.login, dbAccount.passwordHash, dbAccount.refreshToken);
    }

    async create(login: string, passwordHash: string, token: string): Promise<Account> {
        return this.prisma.account.create({
            data: { login, passwordHash, refreshToken: token }
        });
    }

    async updateToken(id: string, token: string): Promise<Account> {
        return this.prisma.account.update({
            where: { id },
            data: { refreshToken: token }
        });
    }
}