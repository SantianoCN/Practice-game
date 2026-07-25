import { Account } from '../../domain/entities/Account';

export interface IAccountRepository {
    getById(accountId: string): Promise<Account | null>;
    getByLogin(login: string): Promise<Account | null>;
    getByToken(token: string): Promise<Account | null>;
    create(login: string, passwordHash: string, token: string): Promise<Account>;
    updateToken(id: string, token: string): Promise<Account>;
    updateProgress(
        accountId: string, 
        gold: number, 
        unlockedClasses: string[], 
        unlockedWeapons: string[]
    ): Promise<Account>;
}