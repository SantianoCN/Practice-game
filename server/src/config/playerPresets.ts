import { EntityStats, PlayerClassPreset } from '../../../shared/gameTypes';
import { STAFF, SWORD, ICE_STAFF, AXE } from './weaponPresets'; // Импортируем готовое оружие

export const WARRIOR_PRESET: EntityStats = {
    maxHp: 150,          
    maxMana: 20,         
    speed: 100,          
    sprite: 'Warrior',
    archetype: 'warrior'
};

export const MAGE_PRESET: EntityStats = {
    maxHp: 80,
    maxMana: 150,
    speed: 130,
    sprite: 'Mage',
    archetype: 'mage'
};

export const PLAYER_CLASSES: Record<string, PlayerClassPreset> = {
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