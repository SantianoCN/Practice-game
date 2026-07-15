// src/domain/services/snapshotService.ts

import Player from '../entities/Player';
import Bullet from '../entities/Bullet';
import { GameSnapshot } from '../../../../shared/gameTypes';
import { ServerRoomState } from '../engines/GameEngine';

export const buildPlayerSnapshot = (
    userId: string,
    players: Map<string, Player>,
    bullets: Bullet[],
    floorMap: (ServerRoomState | null)[][]
): GameSnapshot | null => {
    const player = players.get(userId);
    if (!player) return null;

    const rx = player.currentRoomX;
    const ry = player.currentRoomY;
    const room = floorMap[ry][rx];
    
    if (!room) return null;

    return {
        players: Array.from(players.values())
            .filter(p => p.currentRoomX === rx && p.currentRoomY === ry)
            .map(p => ({ 
                id: p.id, 
                x: Math.round(p.x),
                y: Math.round(p.y), 
                hp: Math.round(p.hp), 
                maxHp: p.maxHp,
                mana: Math.round(p.mana),
                maxMana: p.maxMana,
                sprite: p.sprite 
            })),
        room: {
            gridX: room.gridX,
            gridY: room.gridY,
            isClear: room.isClear,
            hasDoors: room.hasDoors,
            type: room.type,
            enemies: room.enemies.map(e => ({
                id: e.id,
                x: Math.round(e.x),
                y: Math.round(e.y),
                hp: Math.round(e.hp),
                maxHp: e.maxHp,
                sprite: e.sprite
            }))
        }, 
        bullets: bullets
            .filter(b => b.currentRoomX === rx && b.currentRoomY === ry)
            .map(b => ({ 
                id: b.id, 
                x: Math.round(b.x), 
                y: Math.round(b.y)
            }))
    };
};