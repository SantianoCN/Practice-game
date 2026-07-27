export const GAME_DIFFICULTY: Record<string, FloorDifficulty> = {
    LVL1: {
        levelNumber: 1,
        ROOM_COUNT: 10,
        ENEMY_MIN: 2,
        ENEMY_MAX: 4
    },
    LVL2: {
        levelNumber: 2,
        ROOM_COUNT: 15,
        ENEMY_MIN: 5,
        ENEMY_MAX: 10
    },
    LVL3: {
        levelNumber: 3,
        ROOM_COUNT: 18,
        ENEMY_MIN: 8,
        ENEMY_MAX: 12
    },
    LVL4: {
        levelNumber: 4,
        ROOM_COUNT: 22,
        ENEMY_MIN: 10,
        ENEMY_MAX: 16
    }
} as const;

export type FloorDifficulty = {
    levelNumber: number;
    ROOM_COUNT: number;
    ENEMY_MIN: number;
    ENEMY_MAX: number;
};