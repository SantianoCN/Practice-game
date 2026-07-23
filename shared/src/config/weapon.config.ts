import { WeaponStats, ProjectileStats, StartingWeaponStats } from '../types/weapon.schema';

export const FIREBALL: ProjectileStats = { radius: 10, damage: 10, range: 400, speed: 300, visualId: 'red_ball' };
export const SLASH: ProjectileStats = { radius: 10, damage: 15, range: 60, speed: 400, visualId: 'slash_effect' };
export const ICE_BALL: ProjectileStats = { radius: 10, damage: 6, range: 350, speed: 250, visualId: 'blue_ball' };
export const AXE_SLASH: ProjectileStats = { radius: 10, damage: 30, range: 50, speed: 300, visualId: 'axe_slash' };

export const STAFF: WeaponStats = { cooldownMs: 0, manaCost: 10, projectile: FIREBALL, visualId: 'staff' };
export const SWORD: WeaponStats = { cooldownMs: 800, manaCost: 0, projectile: SLASH, visualId: 'iron_sword' };
export const ICE_STAFF: WeaponStats = { cooldownMs: 1000, manaCost: 5, projectile: ICE_BALL, visualId: 'ice_staff' };
export const AXE: WeaponStats = { cooldownMs: 1500, manaCost: 0, projectile: AXE_SLASH, visualId: 'battle_axe' };

export const STARTING_SWORD: StartingWeaponStats = {
    key: 'wpn_iron_sword',
    name: 'Меч-Кладенец',
    description: 'Классический меч. Наносит средний урон с умеренной скоростью.',
    config: SWORD
};

export const STARTING_AXE: StartingWeaponStats = {
    key: 'wpn_heavy_axe', 
    name: 'Секира Перуна',
    description: 'Тяжелый топор. Медленный замах, но наносит колоссальный урон одним ударом.',
    config: AXE
};

export const STARTING_STAFF: StartingWeaponStats = {
    key: 'wpn_fire_staff',
    name: 'Огненный посох',
    description: 'Стреляет мощными огненными шарами на среднюю дистанцию.',
    config: STAFF
};

export const STARTING_ICE_STAFF: StartingWeaponStats = {
    key: 'wpn_ice_staff',
    name: 'Ледяной посох',
    description: 'Посох льда. Наносит меньше урона, но стреляет в два раза чаще.',
    config: ICE_STAFF
};