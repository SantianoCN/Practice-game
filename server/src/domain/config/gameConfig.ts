export const GAME_CONFIG = {
    MAP_SIZE: 10,
    DOOR_SIZE: 100,
    DOOR_PADDING: 15,
    CELL_SIZE: 20,
    ROOM_WIDTH: 800,
    ROOM_HEIGHT: 600,
    TICK_RATE: 20,
}

export type IDGenerator = (prefix: string) => string;