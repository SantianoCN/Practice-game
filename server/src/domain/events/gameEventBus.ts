import { EventEmitter } from 'events';
import { GameSnapshot } from '../../../../shared/gameTypes';

// Создаем глобальный синглтон шины событий
export const gameEventBus = new EventEmitter();

// Константы названий событий, чтобы не опечататься
export const GAME_EVENTS = {
    SNAPSHOT_READY: 'SNAPSHOT_READY',
    // В будущем сюда можно добавить: PLAYER_DIED, ROOM_CLEARED, BOSS_SPAWNED и т.д.
};

// Типизация того, что мы передаем вместе с событием
export interface SnapshotEventPayload {
    sessionId: string;
    userId: string;
    snapshot: GameSnapshot;
}