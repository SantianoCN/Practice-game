import { Account } from "../entities/Account";
import { IRepository } from "./IRepository";


export interface IAccountRepository extends IRepository<Account, string> {
    getByLogin(login: string): Promise<Account | null>
    getByToken(token: string): Promise<Account | null>
    updateByLogin(login: string, obj: Partial<Account>): Promise<Account | null>
}