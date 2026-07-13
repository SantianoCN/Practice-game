import { Account } from "../entities/DbEntities/Account";
import { IRepository } from "./IRepository";


export interface IAccountRepository extends IRepository<Account, string> {
    getByLogin(login: string): Promise<Account | null> 
}