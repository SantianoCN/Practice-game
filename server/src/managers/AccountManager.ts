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
        const testPlayer = new Account('1', '1');


        this.accounts = [goida, drocheslav, vseslav, testPlayer];
    }
    
    public login(data: LoginData): string | null {
        if (!data.login || !data.password) {
            console.log(`[AccountManager] Некоректные данные для логинации.`);
            return null;
        }

        const account = this.accounts.find(
            (acc) =>
                acc.login === data.login
        );

        if (account && 
            account.passwordHash === data.password) {
            const token = IdGenerator.generateUUID('token');
            account.refreshToken = token;
            console.log(`[AccountManager] Пользователь ${data.login} залогинен.`);
            return token;
        }
        
        return null;
    }

    public register(data: LoginData): string | null {
        if (!data.login || !data.password) {
            console.log(`[AccountManager] Некоректные данные для регистрации.`);
            return null;
        }
        const account = this.accounts.find(
            (acc) =>
                acc.login === data.login
        );
        if (account) {
            console.log(`[AccountManager] Пользователь ${data.login} уже зарегистрирован.`);
            return null;
        }
        const token = IdGenerator.generateUUID('token');
        this.accounts.push(
            new Account(
                data.login, 
                data.password,
                token
            )
        );
        console.log(`[AccountManager] Пользователь ${data.login} зарегистрирован.`);
        return token;
    }

    public logout(token: string): boolean {
        const account = this.resolveToken(token)
        if (account) {
            account.refreshToken = '';
            console.log(`[AccountManager] Пользователь ${account.login} вышел из аккаунта.`);
            return true;
        }
        return false;
    }

    // возвращает залогиненого и зарегистриравоного найденого пользователя
    public resolveToken(token: string):  Account | undefined {
        const account = this.accounts.find(
            (acc) => acc.refreshToken === token
        );
        return account;
    }
}