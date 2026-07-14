import { WeaponConfig, ProjectileConfig } from '../../../shared/gameTypes';

export const FIREBALL: ProjectileConfig = {
    damage: 10,
    range: 400,
    speed: 200,
    sprite: 'red_ball'
};

export const STAFF: WeaponConfig = {
    cooldownMs: 2000,
    projectile: FIREBALL,
    sprite: 'staff'
}

export const SLASH: ProjectileConfig = {
    damage: 15,
    range: 60,
    speed: 400,
    sprite: 'slash_effect'
};

export const SWORD: WeaponConfig = {
    cooldownMs: 800,
    projectile: SLASH,
    sprite: 'iron_sword'
};

export const ICE_BALL: ProjectileConfig = {
    damage: 6,
    range: 350,
    speed: 250,
    sprite: 'blue_ball'
};
export const ICE_STAFF: WeaponConfig = {
    cooldownMs: 1000,
    projectile: ICE_BALL,
    sprite: 'ice_staff'
};

export const AXE_SLASH: ProjectileConfig = {
    damage: 30,
    range: 50,
    speed: 300,
    sprite: 'axe_slash'
};
export const AXE: WeaponConfig = {
    cooldownMs: 1500,
    projectile: AXE_SLASH,
    sprite: 'battle_axe'
};