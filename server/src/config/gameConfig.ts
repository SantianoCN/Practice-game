export const GAME_CONFIG = {
    // Настройки сервера и цикла
    TICK_RATE: 20,
    
    // Размеры комнаты
    ROOM_WIDTH: 800,
    ROOM_HEIGHT: 600,
    
    // Генерация карты
    MIN_ROOMS: 5,
    MAX_ROOMS: 10,
    
    // Настройки перехода между комнатами
    TRANSITION_PADDING: 15, // Отступ от края экрана для срабатывания перехода
    
    // Спавн сущностей
    SPAWN_PADDING: 100, // Безопасная зона от краев комнаты при спавне врагов
    MIN_ENEMIES_PER_ROOM: 1,
    MAX_ENEMIES_PER_ROOM: 3,
};