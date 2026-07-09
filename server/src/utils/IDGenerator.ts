import { randomUUID } from 'crypto';

export class IdGenerator {
    private static counters = new Map<string, number>();

    public static generateUUID(prefix: string, short: boolean = true): string {
        return `${prefix}_${randomUUID()}`;
    }

    public static generateId(prefix: string): string {
        const currentCount = this.counters.get(prefix) || 0;
        
        const nextCount = currentCount + 1;
        this.counters.set(prefix, nextCount);

        return `${prefix}_${nextCount}`;
    }

    public static resetCounters(): void {
        this.counters.clear();
    }
}