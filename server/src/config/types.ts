export interface EntityStats {
    maxHp: number;
    maxMana: number;
    speed: number;
    spriteKey: string;
}

export interface WeaponConfig {
    damage: number;
    range: number;
    speed: number;
    cooldownMs: number;
}