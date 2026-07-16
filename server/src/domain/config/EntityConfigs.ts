import { StartingWeaponPreset } from "./WeaponConfigs"

export interface EntityStats {
    maxHp: number,
    maxMana: number,
    speed: number,
    sprite: string,
    archetype: string
};

export interface PlayerClassPresetSchema {
    key: string,
    name: string,
    description: string,
    stats: EntityStats,
    startingWeapons: StartingWeaponPreset
};