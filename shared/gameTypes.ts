export interface PlayerAction {
    keys: {
        up: boolean;
        down: boolean;
        left: boolean;
        right: boolean;
        shoot: boolean;
    };
}

export interface EntityStats {
    maxHp: number;
    maxMana: number;
    speed: number;
    spriteKey: string;
}

// Тот самый слепок, который сервер собирает и отправляет браузерам 60 раз в секунду
export interface GameSnapshot {
    players: { id: string, x: number, y: number, hp: number, mana: number, width: number, height: number, sprite: string }[];
    enemies: { id: string, x: number, y: number, hp: number, width: number, height: number, sprite: string }[];
    bullets: { id: string, x: number, y: number, width: number, height: number }[];
}