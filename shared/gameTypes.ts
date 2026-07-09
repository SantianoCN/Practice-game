export interface PlayerAction {
    sessionId: string;
    userId: string;
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
    maxHp: number;
    width: number;
    height: number;
    sprite: string;
}

export interface Player {
    id: string;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    mana: number;
    maxMana: number;
    width: number;
    height: number;
    sprite: string;
}

export interface Bullet {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface GameSnapshot {
    players: Player[];
    enemies: Entity[];
    bullets: Bullet[];
}

export interface SessionJoinRequest {
    sessionId: string;
    userId: string;
    name: string;
    archetype: 'warrior' | 'mage';
}

export interface SessionCreateRequest {
    userId: string;
    name: string;
    archetype: 'warrior' | 'mage';
}

export interface SessionCreateResponse {
    sessionId: string;
}

export interface SessionConnectResponse {
    success: boolean;
    sessionId: string;
    snapshot: any;
}

export interface SessionLeaveRequest {
    sessionId: string;
    userId: string;
}

export interface LoginData {
    login: string;
    password: string;
}