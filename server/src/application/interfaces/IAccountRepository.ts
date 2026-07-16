import { Account } from '../../domain/entities/Account';

export interface IAccountRepository {
    getByLogin(login: string): Promise<Account | null>;

    getByToken(token: string): Promise<Account | null>;

    create(login: string, passwordHash: string, token: string): Promise<Account>;

    updateToken(id: string, token: string): Promise<Account>;
}