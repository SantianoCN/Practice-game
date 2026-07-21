import { Player } from '../entities/Player';
import { Weapon } from '../entities/Weapon';
import { Enemy } from '../entities/Enemy';
import { IDGenerator, WeaponStats, EntityStats, PLAYER_CLASSES } from '@game/shared';

export class EntityFactory {
    
    public static createPlayer(
        userId: string,
        login: string,
        archetype: string,
        weaponId: string,
        startX: number,
        startY: number,
        generateId: IDGenerator
    ): Player {
        const classPreset = PLAYER_CLASSES[archetype] || PLAYER_CLASSES['warrior'];
        const stats: EntityStats = classPreset.stats;

        let weaponPreset = classPreset.startingWeapons.find(w => w.key === weaponId);
        if (!weaponPreset) {
            weaponPreset = classPreset.startingWeapons[0];
        }

        const weapon = new Weapon(
            generateId('wpn'),
            weaponPreset.key,
            weaponPreset.name,
            weaponPreset.config
        );

        const player = new Player(
            userId,         
            login,
            startX,
            startY,
            stats,
            weapon,
            stats.maxMana,  
            stats.maxMana,
            stats.manaRegen
        );

        return player;
    }

    public static createEnemy(
        x: number,
        y: number,
        stats: EntityStats,
        weaponConfig: WeaponStats,
        generateId: IDGenerator
    ): Enemy {
        const weapon = new Weapon(
            generateId('wpn'), 
            weaponConfig.visualId,
            'Вражеское Оружие', 
            weaponConfig
        );
        
        return new Enemy(
            generateId('enm'),
            x,
            y,
            stats,
            weapon
        );
    }
}