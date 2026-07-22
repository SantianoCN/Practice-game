"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaAccountRepo = void 0;
const Account_1 = require("../../domain/entities/Account");
class PrismaAccountRepo {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getByLogin(login) {
        const dbAccount = await this.prisma.account.findFirst({ where: { login } });
        if (!dbAccount)
            return null;
        return new Account_1.Account(dbAccount.id, dbAccount.login, dbAccount.passwordHash, dbAccount.refreshToken);
    }
    async getByToken(token) {
        const dbAccount = await this.prisma.account.findFirst({ where: { refreshToken: token } });
        if (!dbAccount)
            return null;
        return new Account_1.Account(dbAccount.id, dbAccount.login, dbAccount.passwordHash, dbAccount.refreshToken);
    }
    async create(login, passwordHash, token) {
        return this.prisma.account.create({
            data: { login, passwordHash, refreshToken: token }
        });
    }
    async updateToken(id, token) {
        return this.prisma.account.update({
            where: { id },
            data: { refreshToken: token }
        });
    }
}
exports.PrismaAccountRepo = PrismaAccountRepo;
