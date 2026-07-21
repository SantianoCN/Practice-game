import { IAccountRepository } from '../interfaces/IAccountRepository';
import { IIdGenerator } from '../interfaces/IIdGenerator';
import { LoginDataDTO } from '@game/shared';
import { Account } from '../../domain/entities/Account';

export class AuthUseCase {
    constructor(
        private repo: IAccountRepository,
        private idGen: IIdGenerator
    ) {}

    public async login(data: LoginDataDTO): Promise<{ token: string; account: Account } | null> {
        const account = await this.repo.getByLogin(data.login);
        if (account && account.passwordHash === data.password) {
            const token = this.idGen.generateUUID('token');
            const updatedAccount = await this.repo.updateToken(account.id, token);
            return { token, account: updatedAccount };
        }
        return null;
    }

    public async register(data: LoginDataDTO): Promise<{ token: string; account: Account } | null> {
        const existing = await this.repo.getByLogin(data.login);
        if (existing) return null;

        const token = this.idGen.generateUUID('token');
        const account = await this.repo.create(data.login, data.password, token);
        return { token, account };
    }

    public async resolveToken(token: string): Promise<Account | null> {
        return this.repo.getByToken(token);
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