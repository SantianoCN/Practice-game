import Player from '../entities/Player';
import Weapon from '../items/Weapon';
import { IdGenerator } from '../utils/IDGenerator';
import { PLAYER_CLASSES } from '../../config/playerPresets';

// Чистая функция для создания сущности игрока
export const createPlayerEntity = (
    userId: string, 
    name: string, 
    archetype: string, 
    weaponId: string, 
    startX: number, 
    startY: number
): Player => {
    let selectedPreset = PLAYER_CLASSES[archetype];
    
    if (!selectedPreset) {
        console.warn(`[PlayerFactory] Неизвестный класс: "${archetype}" от ${userId}. Сбрасываем на warrior.`);
        selectedPreset = PLAYER_CLASSES.warrior;
    }

    const weaponPreset = selectedPreset.startingWeapons.find(w => w.key === weaponId) 
        || selectedPreset.startingWeapons[0];

    const weaponInstanceId = IdGenerator.generateId('weapon');
    const startWeapon = new Weapon(
        weaponInstanceId, 
        weaponPreset.name, 
        weaponPreset.config
    );
    
    return new Player(
        userId, 
        name, 
        startX, 
        startY, 
        selectedPreset.stats, 
        startWeapon
    );
};