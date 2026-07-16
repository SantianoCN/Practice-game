import { IAccountRepository } from '../interfaces/IAccountRepository';
import { IIdGenerator } from '../interfaces/IIdGenerator';
import { LoginDataDTO } from '@game/shared';

export class AuthUseCase {
    constructor(
        private repo: IAccountRepository,
        private idGen: IIdGenerator
    ) {}

    public async login(data: LoginDataDTO): Promise<string | null> {
        const account = await this.repo.getByLogin(data.login);
        if (account && account.passwordHash === data.password) {
            const token = this.idGen.generateUUID('token');
            await this.repo.updateToken(account.id, token);
            return token;
        }
        return null;
    }

    public async register(data: LoginDataDTO): Promise<string | null> {
        const existing = await this.repo.getByLogin(data.login);
        if (existing) return null;

        const token = this.idGen.generateUUID('token');
        await this.repo.create(data.login, data.password, token);
        return token;
    }

    public async resolveToken(token: string): Promise<string | null> {
        const account = await this.repo.getByToken(token);
        return account ? account.login : null;
    }

    public async logout(token: string): Promise<boolean> {
        const account = await this.repo.getByToken(token);
        if (account) {
            await this.repo.updateToken(account.id, '');
            return true;
        }
        return false;
    }
}