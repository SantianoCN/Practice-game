export const GAME_DIFFICULTY: Record<string, FloorDifficulty> = {
    LVL1: {
        levelNumber: 1,
        ROOM_COUNT: 10
    },
    LVL2: {
        levelNumber: 2,
        ROOM_COUNT: 15
    }
} as const;

export type FloorDifficulty = {
    levelNumber: number;
    ROOM_COUNT: number;
};