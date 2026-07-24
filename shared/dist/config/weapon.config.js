"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STARTING_ICE_STAFF = exports.STARTING_STAFF = exports.STARTING_AXE = exports.STARTING_SWORD = exports.AXE = exports.ICE_STAFF = exports.SWORD = exports.STAFF = exports.AXE_SLASH = exports.ICE_BALL = exports.SLASH = exports.FIREBALL = void 0;
exports.FIREBALL = { radius: 10, damage: 10, range: 400, speed: 300, visualId: 'red_ball' };
exports.SLASH = { radius: 10, damage: 15, range: 60, speed: 400, visualId: 'slash_effect' };
exports.ICE_BALL = { radius: 10, damage: 6, range: 350, speed: 250, visualId: 'blue_ball' };
exports.AXE_SLASH = { radius: 10, damage: 30, range: 50, speed: 300, visualId: 'axe_slash' };
exports.STAFF = { cooldownMs: 2000, manaCost: 10, projectile: exports.FIREBALL, visualId: 'staff' };
exports.SWORD = { cooldownMs: 800, manaCost: 0, projectile: exports.SLASH, visualId: 'iron_sword' };
exports.ICE_STAFF = { cooldownMs: 1000, manaCost: 5, projectile: exports.ICE_BALL, visualId: 'ice_staff' };
exports.AXE = { cooldownMs: 1500, manaCost: 0, projectile: exports.AXE_SLASH, visualId: 'battle_axe' };
exports.STARTING_SWORD = {
    key: 'wpn_iron_sword',
    name: 'Меч-Кладенец',
    description: 'Классический меч. Наносит средний урон с умеренной скоростью.',
    config: exports.SWORD
};
exports.STARTING_AXE = {
    key: 'wpn_heavy_axe',
    name: 'Секира Перуна',
    description: 'Тяжелый топор. Медленный замах, но наносит колоссальный урон одним ударом.',
    config: exports.AXE
};
exports.STARTING_STAFF = {
    key: 'wpn_fire_staff',
    name: 'Огненный посох',
    description: 'Стреляет мощными огненными шарами на среднюю дистанцию.',
    config: exports.STAFF
};
exports.STARTING_ICE_STAFF = {
    key: 'wpn_ice_staff',
    name: 'Ледяной посох',
    description: 'Посох льда. Наносит меньше урона, но стреляет в два раза чаще.',
    config: exports.ICE_STAFF
};
