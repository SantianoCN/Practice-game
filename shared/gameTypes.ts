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

export interface Entity {
    id: string;
    x: number;
    y: number;
    hp: number;
    sprite: string;
}

export interface Bullet {
    id: string;
    x: number;
    y: number;
}

// Тот самый слепок, который сервер собирает и отправляет браузерам 60 раз в секунду
export interface GameSnapshot {
    players: Entity[];
    enemies: Entity[];
    bullets: Bullet[];
}

export interface LoginData {
    login: string;
    password: string;
}