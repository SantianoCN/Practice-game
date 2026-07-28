export interface IIdGenerator {
    generateId(prefix: string): string;
    generateUUID(maxLength?: number): string;
}