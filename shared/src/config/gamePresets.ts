import { 
    ProjectileConfigDTO, 
    WeaponConfigDTO, 
    EntityStatsDTO, 
    PlayerClassPresetDTO 
} from '../dtos/ConfigDtos';

export const FIREBALL: ProjectileConfigDTO = { damage: 10, range: 400, speed: 200, sprite: 'red_ball' };
export const SLASH: ProjectileConfigDTO = { damage: 15, range: 60, speed: 400, sprite: 'slash_effect' };
export const ICE_BALL: ProjectileConfigDTO = { damage: 6, range: 350, speed: 250, sprite: 'blue_ball' };
export const AXE_SLASH: ProjectileConfigDTO = { damage: 30, range: 50, speed: 300, sprite: 'axe_slash' };

export const STAFF: WeaponConfigDTO = { cooldownMs: 2000, projectile: FIREBALL, sprite: 'staff' };
export const SWORD: WeaponConfigDTO = { cooldownMs: 800, projectile: SLASH, sprite: 'iron_sword' };
export const ICE_STAFF: WeaponConfigDTO = { cooldownMs: 1000, projectile: ICE_BALL, sprite: 'ice_staff' };
export const AXE: WeaponConfigDTO = { cooldownMs: 1500, projectile: AXE_SLASH, sprite: 'battle_axe' };

export const WARRIOR_PRESET: EntityStatsDTO = { maxHp: 150, maxMana: 20, speed: 100, sprite: 'Warrior', archetype: 'warrior' };
export const MAGE_PRESET: EntityStatsDTO = { maxHp: 80, maxMana: 150, speed: 130, sprite: 'Mage', archetype: 'mage' };

export const WARRIOR_PRESET_LIZARD: EntityStatsDTO = { maxHp: 10, maxMana: 20, speed: 90, sprite: 'red_box', archetype: 'warrior' };
export const MAGE_PRESET_LIZARD: EntityStatsDTO = { maxHp: 10, maxMana: 150, speed: 110, sprite: 'orange_box', archetype: 'mage' };

export const PLAYER_CLASSES: Record<string, PlayerClassPresetDTO> = {
    warrior: {
        key: 'warrior',
        name: 'Рус-Богатырь (Воин)',
        description: 'Крепкий защитник Земли Русской. Обладает огромным запасом здоровья, но невысокой скоростью.',
        stats: WARRIOR_PRESET,
        startingWeapons: [
            {
                key: 'sword_iron',
                name: 'Меч-Кладенец',
                description: 'Классический меч. Наносит средний урон с умеренной скоростью.',
                config: SWORD
            },
            {
                key: 'axe_heavy',
                name: 'Секира Перуна',
                description: 'Тяжелый топор. Медленный замах, но наносит колоссальный урон одним ударом.',
                config: AXE
            }
        ]
    },
    mage: {
        key: 'mage',
        name: 'Рус-Волхв (Маг)',
        description: 'Мудрый колдун, повелевающий силами стихий. Быстрый, имеет много маны, но слабое здоровье.',
        stats: MAGE_PRESET,
        startingWeapons: [
            {
                key: 'staff_fire',
                name: 'Огненный посох',
                description: 'Стреляет мощными огненными шарами на среднюю дистанцию.',
                config: STAFF
            },
            {
                key: 'staff_ice',
                name: 'Ледяной посох',
                description: 'Посох льда. Наносит меньше урона, но стреляет в два раза чаще.',
                config: ICE_STAFF
            }
        ]
    }
};