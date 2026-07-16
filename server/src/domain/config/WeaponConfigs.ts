export interface ProjectileConfig {
    damage: number,
    range: number,
    speed: number,
    sprite: string
};

export interface WeaponConfig {
    cooldownMs: number,
    projectile: ProjectileConfig,
    sprite: string
};

export interface StartingWeaponPreset {
    key: string,
    name: string,
    description: string,
    config: WeaponConfig
};