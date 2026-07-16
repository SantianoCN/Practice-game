import * as crypto from 'crypto';
import { IIdGenerator } from '../../application/interfaces/IIdGenerator';

export class CryptoIdGenerator implements IIdGenerator {
    public generateId(prefix: string): string {
        return `${prefix}_${crypto.randomBytes(4).toString('hex')}`;
    }

    public generateUUID(prefix: string): string {
        return `${prefix}_${crypto.randomUUID()}`;
    }
}