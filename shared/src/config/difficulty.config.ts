import { EntityStats } from '../types/stats.schema';
import { WeaponStats } from '../types/weapon.schema';
import { WARRIOR_PRESET_LIZARD, MAGE_PRESET_LIZARD, ELITE_LIZARD_PRESET, ARCHMAGE_LIZARD_PRESET } from './classes.config';
import { SWORD, AXE, STAFF, ICE_STAFF, LIGHTNING_STAFF } from './weapon.config';

export interface EnemyPoolEntry {
    stats: EntityStats;
    allowedWeapons: WeaponStats[];
}

export type FloorDifficulty = {
    levelNumber: number;
    ROOM_COUNT: number;
    ENEMY_MIN: number;
    ENEMY_MAX: number;
    enemyPool: EnemyPoolEntry[];
};

export const GAME_DIFFICULTY: Record<string, FloorDifficulty> = {
    LVL1: {
        levelNumber: 1,
        ROOM_COUNT: 10,
        ENEMY_MIN: 3,
        ENEMY_MAX: 5,
        enemyPool: [
            { stats: WARRIOR_PRESET_LIZARD, allowedWeapons: [SWORD] },
            { stats: MAGE_PRESET_LIZARD, allowedWeapons: [STAFF] }
        ]
    },
    LVL2: {
        levelNumber: 2,
        ROOM_COUNT: 13,
        ENEMY_MIN: 4,
        ENEMY_MAX: 8,
        enemyPool: [
            { stats: WARRIOR_PRESET_LIZARD, allowedWeapons: [SWORD, AXE] },
            { stats: MAGE_PRESET_LIZARD, allowedWeapons: [STAFF, ICE_STAFF] }
        ]
    },
    LVL3: {
        levelNumber: 3,
        ROOM_COUNT: 15,
        ENEMY_MIN: 6,
        ENEMY_MAX: 10,
        enemyPool: [
            { stats: WARRIOR_PRESET_LIZARD, allowedWeapons: [AXE] },
            { stats: MAGE_PRESET_LIZARD, allowedWeapons: [ICE_STAFF, LIGHTNING_STAFF] },
            { stats: ELITE_LIZARD_PRESET, allowedWeapons: [SWORD, AXE] }
        ]
    },
    LVL4: {
        levelNumber: 4,
        ROOM_COUNT: 20,
        ENEMY_MIN: 5,
        ENEMY_MAX: 9,
        enemyPool: [
            { stats: ELITE_LIZARD_PRESET, allowedWeapons: [AXE] },
            { stats: ARCHMAGE_LIZARD_PRESET, allowedWeapons: [LIGHTNING_STAFF] }
        ]
    },
    LVL5: {
        levelNumber: 5,
        ROOM_COUNT: 25,
        ENEMY_MIN: 7,
        ENEMY_MAX: 10,
        enemyPool: [
            { stats: ELITE_LIZARD_PRESET, allowedWeapons: [AXE] },
            { stats: ARCHMAGE_LIZARD_PRESET, allowedWeapons: [LIGHTNING_STAFF] }
        ]
    }
} as const;