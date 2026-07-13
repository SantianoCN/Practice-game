import { Account } from "@prisma/client";

export interface IRepository<T, ID = string> {
    save(obj: T): Promise<T>;
    get(id: ID): Promise<T | null>;
    getAll(): Promise<T[]>;
    updated(id: ID, obj: T): Promise<T | null>;
    delete(id: ID): Promise<boolean>;
}