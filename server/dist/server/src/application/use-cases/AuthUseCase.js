"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthUseCase = void 0;
class AuthUseCase {
    repo;
    idGen;
    constructor(repo, idGen) {
        this.repo = repo;
        this.idGen = idGen;
    }
    async login(data) {
        const account = await this.repo.getByLogin(data.login);
        if (account && account.passwordHash === data.password) {
            const token = this.idGen.generateUUID('token');
            await this.repo.updateToken(account.id, token);
            return token;
        }
        return null;
    }
    async register(data) {
        const existing = await this.repo.getByLogin(data.login);
        if (existing)
            return null;
        const token = this.idGen.generateUUID('token');
        await this.repo.create(data.login, data.password, token);
        return token;
    }
    async resolveToken(token) {
        const account = await this.repo.getByToken(token);
        return account ? account.login : null;
    }
    async logout(token) {
        const account = await this.repo.getByToken(token);
        if (account) {
            await this.repo.updateToken(account.id, '');
            return true;
        }
        return false;
    }
}
exports.AuthUseCase = AuthUseCase;
