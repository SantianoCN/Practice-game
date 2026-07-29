import { WeaponStats, ProjectileStats, StartingWeaponStats } from '../types/weapon.schema';

export const FIREBALL: ProjectileStats = { radius: 12, damage: 10, range: 400, speed: 300, visualId: 'red_ball' };
export const SLASH: ProjectileStats = { radius: 16, damage: 15, range: 60, speed: 400, visualId: 'slash_effect' };
export const ICE_BALL: ProjectileStats = { radius: 12, damage: 6, range: 350, speed: 250, visualId: 'blue_ball' };
export const AXE_SLASH: ProjectileStats = { radius: 16, damage: 30, range: 50, speed: 300, visualId: 'axe_slash' };
export const POISON_DART: ProjectileStats = { radius: 10, damage: 12, range: 450, speed: 500, visualId: 'green_dart' };
export const LIGHTNING: ProjectileStats = { radius: 12, damage: 22, range: 380, speed: 600, visualId: 'lightning_spark' };

export const STAFF: WeaponStats = { cooldownMs: 2000, manaCost: 10, projectile: FIREBALL, visualId: 'fire_staff' };
export const SWORD: WeaponStats = { cooldownMs: 800, manaCost: 0, projectile: SLASH, visualId: 'iron_sword' };
export const ICE_STAFF: WeaponStats = { cooldownMs: 1000, manaCost: 5, projectile: ICE_BALL, visualId: 'ice_staff' };
export const AXE: WeaponStats = { cooldownMs: 1500, manaCost: 0, projectile: AXE_SLASH, visualId: 'battle_axe' };
export const BOW: WeaponStats = { cooldownMs: 900, manaCost: 0, projectile: POISON_DART, visualId: 'hunter_bow' };
export const LIGHTNING_STAFF: WeaponStats = { cooldownMs: 1300, manaCost: 15, projectile: LIGHTNING, visualId: 'lightning_staff' };
export const STAFF_OF_BOSS: WeaponStats = { cooldownMs: 500, manaCost: 20, projectile: FIREBALL, visualId: 'fire_staff_boos' };

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

export const STARTING_BOW: StartingWeaponStats = {
    key: 'wpn_hunter_bow',
    name: 'Охотничий Лук',
    description: 'Быстрострельное дальнобойное оружие, не требующее маны.',
    config: BOW
};

export const STARTING_LIGHTNING_STAFF: StartingWeaponStats = {
    key: 'wpn_lightning_staff',
    name: 'Посох Перуна',
    description: 'Извергает молнии с высокой скоростью и хорошим уроном.',
    config: LIGHTNING_STAFF
};