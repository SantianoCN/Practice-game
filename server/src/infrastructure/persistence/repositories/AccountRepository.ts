import { PrismaClient } from '@prisma/client'
import { Account } from '../../../domain/entities/DbEntities/Account'
import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';

export class AccountRepository implements IAccountRepository {
    constructor(private prisma: PrismaClient) { }

    async save(obj: Account): Promise<Account> {
        const created = await this.prisma.account.create({
            data: {
                login: obj.login,
                passwordHash: obj.passwordHash,
                refreshToken: obj.refreshToken
            }
        });
        return created;
    }

    async get(id: string): Promise<Account | null> {
        const account = await this.prisma.account.findUnique({ where: { id: id }});
        return account ? account : null;
    }

    async getByLogin(login: string): Promise<Account | null> {
        const account = await this.prisma.account.findFirst({ where: { login: login }});
        return account ? account : null;
    }

    async getByToken(token: string): Promise<Account | null> {
        const account = await this.prisma.account.findFirst({ where: { refreshToken: token }});
        return account ? account : null;
    }

    async getAll(): Promise<Account[]> {
        const accounts = await this.prisma.account.findMany();
        return accounts;
    }

    async updated(id: string, obj: Partial<Account>): Promise<Account | null> {
        const existing = await this.prisma.account.findUnique({ where: { id: id}});
        if (existing) {
            const updated = await this.prisma.account.update({
                where: { id: id}, 
                data: {
                    login: obj.login ?? existing.login,
                    passwordHash: obj.passwordHash ?? existing.login,
                    refreshToken: obj.refreshToken ?? existing.refreshToken
                }
            });
            return this.toDomain(updated);
        }
        return null;
    }

    async delete(id: string): Promise<boolean> {
        try {
            await this.prisma.account.delete({ where: { id }});
            return true;
        } catch(ex) {
            console.log(ex);
            return false;
        }
    }

    private toDomain(row: { id: string; login: string; passwordHash: string; refreshToken: string }): Account {
        return new Account(row.login, row.passwordHash, row.refreshToken);
    }
}