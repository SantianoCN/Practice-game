import Player from '../entities/Player';
import Bullet from '../entities/Bullet';
import { ServerRoomState } from '../utils/mapGenerator';
import { processCollisions } from './collisionService';
import { Chest } from '../entities/Chest';
import { BaseNetworkEntity } from '../../../../shared/gameTypes';

// Функция берет на себя всю грязную работу по обновлению активных комнат
export const updateActiveRooms = (
    players: Map<string, Player>,
    bullets: Bullet[],
    floorMap: (ServerRoomState | null)[][],
    roomWidth: number,
    roomHeight: number,
    deltaTime: number
): void => {
    // Группируем активных игроков по комнатам
    const activeRooms = new Map<string, { rx: number, ry: number, players: Player[], roomState: ServerRoomState }>();
    for (const player of players.values()) {
        const rx = player.currentRoomX;
        const ry = player.currentRoomY;
        const roomState = floorMap[ry][rx];
        if (roomState) {
            const key = `${rx},${ry}`;
            if (!activeRooms.has(key)) {
                activeRooms.set(key, { rx, ry, players: [], roomState });
            }
            activeRooms.get(key)!.players.push(player);
        }
    }

    // Обновляем ИИ монстров и проверяем коллизии в каждой активной комнате
    for (const active of activeRooms.values()) {
        const room = active.roomState;
        const playersInRoom = active.players;

        for (const enemy of room.enemies) {
            enemy.updateEntity(deltaTime);
            enemy.updateTarget(playersInRoom);
        }

        const bulletsInRoom = bullets.filter(b => b.currentRoomX === active.rx && b.currentRoomY === active.ry);
        
        room.enemies = room.enemies.filter(e => e.hp > 0);
        let areDoorsOpen = room.enemies.length === 0;

        processCollisions(
            bulletsInRoom, 
            playersInRoom, 
            room.enemies, 
            roomWidth, 
            roomHeight,
            room.hasDoors,
            room.obstacles,
            room.chests,
            room.droppedItems,
            areDoorsOpen 
        );

        room.enemies = room.enemies.filter(e => e.hp > 0);
        areDoorsOpen = room.enemies.length === 0;

        if (areDoorsOpen && !room.isClear) {
            room.isClear = true;
            console.log(`[GameEngine] Комната [${active.rx}, ${active.ry}] зачищена! Двери открыты.`);
        }
    }
};

export const cleanupDeadEntities = (floorMap: (ServerRoomState | null)[][]): void => {
    for (const row of floorMap) {
        for (const room of row) {
            if (room) {
                room.enemies = room.enemies.filter(e => e.hp > 0);
            }
        }
    }
};