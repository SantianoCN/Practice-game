import * as crypto from 'crypto';
import { IIdGenerator } from '../../application/interfaces/IIdGenerator';

export class CryptoIdGenerator implements IIdGenerator {
    public generateId(prefix: string): string {
        return `${prefix}_${crypto.randomBytes(4).toString('hex')}`;
    }

    public generateUUID(maxLength?: number): string {
        const fullId = crypto.randomUUID();
        if (maxLength === undefined || maxLength <= 0) {
            return fullId;
        }
        return fullId.slice(0, maxLength);
    }
}