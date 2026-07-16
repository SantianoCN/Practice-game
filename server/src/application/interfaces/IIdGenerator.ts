export interface IIdGenerator {
    generateId(prefix: string): string;
    generateUUID(prefix: string): string;
}