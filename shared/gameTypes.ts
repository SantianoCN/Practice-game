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

export interface SessionCreateRequest {
    name: string;
    archetype: 'warrior' | 'mage';
}

export interface SessionCreateResponse {
    sessionId: string;
}

export interface SessionJoinResponse {
    sessionId: string;
}

export interface SessionJoinRequest {
    sessionId: string;
    name: string;
    archetype: 'warrior' | 'mage';
}

export interface LoginData {
    login: string;
    password: string;
}

export type RoomType = 'Start' | 'Normal' | 'Boss' | 'Treasure' | 'Shop';
export type Direction = 'Top' | 'Bottom' | 'Left' | 'Right';

export interface RoomState {
    gridX: number;
    gridY: number;
    isClear: boolean;
    type: RoomType;
    hasDoor: {[key in Direction]: boolean};
    respawnedEntity: Entity[];
    distansToSpawn: number;
}

export interface VectorXY{
    x: number;
    y: number;
}