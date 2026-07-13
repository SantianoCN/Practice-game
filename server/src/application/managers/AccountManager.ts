import { LoginData } from "../../../../shared/gameTypes";
import { Account } from "../../domain/entities/DbEntities/Account";
import { IAccountRepository } from "../../domain/repositories/IAccountRepository";
import { IdGenerator } from "../../domain/utils/IDGenerator";

export class AccountManager {
    constructor(private repo: IAccountRepository) { }
    
    public async login(data: LoginData): Promise<string | null> {
        if (!data.login || !data.password)
            return null;

        const account = await this.repo.getByLogin(data.login);

        if (account && 
            account.passwordHash === data.password) {
            const token = IdGenerator.generateUUID('token');
            account.refreshToken = token;
            return token;
        }
        return null;
    }

    public async register(data: LoginData): Promise<string | null> {
        if (!data.login || !data.password) 
            return null;

        const account = await this.repo.getByLogin(data.login);
        if (account) 
            return null;

        const token = IdGenerator.generateUUID('token');
        await this.repo.save(new Account(
                data.login, 
                data.password,
                token
            ));
        return token;
    }

    // возвращает id клиента, если токен авторизован
    // null если токен не найден
    public async resolveToken(token: string): string | null  {
        const account = await this.repo.getByToken(token);
        return account?.login ?? null;
    }
}