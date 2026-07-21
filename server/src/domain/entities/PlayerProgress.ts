export class PlayerProgress {
    constructor(
        public readonly metaGold: number,
        public readonly unlockedClasses: string[],
        public readonly unlockedWeapons: string[]
    ) {}
}