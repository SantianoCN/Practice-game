// src/domain/services/snapshotService.ts

import Player from '../entities/Player';
import Bullet from '../entities/Bullet';
import { GameSnapshot } from '../../../../shared/gameTypes';
import { ServerRoomState } from '../utils/mapGenerator';

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
                        x: p.x,
                        y: p.y,
                        hp: p.hp,
                        maxHp: p.maxHp,
                        mana: p.mana,
                        maxMana: p.maxMana,
                        width: p.width,
                        height: p.height,
                        sprite: p.sprite
                    })),
                room: room,
                bullets: bullets
                    .filter(b => b.currentRoomX === rx && b.currentRoomY === ry)
                    .map(b => ({
                        id: b.id,
                        x: b.x,
                        y: b.y,
                        width: b.width,
                        height: b.height,
                        sprite: b.sprite
                    }))
            };
    };
