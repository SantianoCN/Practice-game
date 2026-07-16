import { Player } from '../entities/Player';
import { Weapon } from '../entities/Weapon';
import { Enemy } from '../entities/Enemy';
import { PLAYER_CLASSES, WeaponConfig } from '../config/WeaponConfigs';
import { EntityStats } from '../config/EntityConfigs';

export type IDGenerator = (prefix: string) => string;

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
            stats.maxMana   
        );

        return player;
    }

    public static createEnemy(
        x: number,
        y: number,
        stats: EntityStats,
        weaponConfig: WeaponConfig,
        generateId: IDGenerator
    ): Enemy {
        const weapon = new Weapon(
            generateId('wpn'), 
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