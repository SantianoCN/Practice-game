export class PlayerProgress {
    constructor(
        public readonly gold: number,
        public readonly unlockedClasses: string[],
        public readonly unlockedWeapons: string[]
    ) {}
}