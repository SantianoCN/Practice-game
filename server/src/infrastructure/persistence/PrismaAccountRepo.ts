import { PrismaClient } from '@prisma/client';
import { IAccountRepository } from '../../application/interfaces/IAccountRepository';

export class PrismaAccountRepo implements IAccountRepository {
    constructor(private prisma: PrismaClient) {}

    async getByLogin(login: string) {
        return this.prisma.account.findFirst({ where: { login } });
    }

    async getByToken(token: string) {
        return this.prisma.account.findFirst({ where: { refreshToken: token } });
    }

    async create(login: string, passwordHash: string, token: string) {
        return this.prisma.account.create({
            data: { login, passwordHash, refreshToken: token }
        });
    }

    async updateToken(id: string, token: string) {
        return this.prisma.account.update({
            where: { id },
            data: { refreshToken: token }
        });
    }
}