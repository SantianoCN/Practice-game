import { LoginData } from "../../../shared/gameTypes";
import { IdGenerator } from "../utils/IDGenerator";


class Account {
    public login: string;
    public passwordHash: string;
    public refreshToken: string;

    public constructor(login: string, password: string, token: string = '') {
        this.login = login;
        this.passwordHash = password; // hash(password)
        this.refreshToken = token;
    }
}

export class AccountManager {
    private accounts: Account[] = new Array<Account>();

    constructor() {
        const goida = new Account('ГОЙДА', '123');
        const drocheslav = new Account('Дрочеслав', '123');
        const vseslav = new Account('Всеслав', '123');


        this.accounts = [goida, drocheslav, vseslav];
    }
    
    public login(data: LoginData): string | null {
        if (!data.login || !data.password) 
            return null;

        const account = this.accounts.find(
            (acc) =>
                acc.login === data.login
        );

        if (account && 
            account.passwordHash === data.password) {
            const token = IdGenerator.generateUUID('token');
            account.refreshToken = token;
            return token;
        }
        return null;
    }

    public register(data: LoginData): string | null {
        if (!data.login || !data.password) 
            return null;

        const account = this.accounts.find(
            (acc) =>
                acc.login === data.login
        );
        if (account) 
            return null;

        const token = IdGenerator.generateUUID('token');
        this.accounts.push(
            new Account(
                data.login, 
                data.password,
                token
            )
        );
        return token;
    }

    // возвращает id клиента, если токен авторизован
    // null если токен не найден
    public resolveToken(token: string): string | null  {
        const account = this.accounts.find(
            (acc) => acc.refreshToken === token
        );
        return account?.login ?? null;
    }
}