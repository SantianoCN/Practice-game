import { ServerRoomState } from "../server/src/domain/utils/mapGenerator";

export interface PlayerAction {
    keys: {
        up: boolean;
        down: boolean;
        left: boolean;
        right: boolean;
        attack: boolean;
    };
}

export interface EntityStats {
    maxHp: number;
    maxMana: number;
    speed: number;
    sprite: string;
    archetype: string;
}

export interface ProjectileConfig {
    damage: number;
    range: number;
    speed: number;
    sprite: string;
}

export interface WeaponConfig {
    cooldownMs: number;
    projectile: ProjectileConfig;
    sprite: string;
}

export interface StartingWeaponPreset {
    key: string;             
    name: string;            
    description: string;     
    config: WeaponConfig;    
}

export interface PlayerClassPreset {
    key: string;             
    name: string;            
    description: string;     
    stats: EntityStats;      
    startingWeapons: StartingWeaponPreset[];
}

export interface BaseNetworkEntity {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    sprite: string;
}

export interface Particle {
    id: string;
    type: string;
    sprite: string;
}

export interface Chest extends BaseNetworkEntity {
    items: Particle[];
} 

export interface Bullet extends BaseNetworkEntity {}

export interface Entity extends BaseNetworkEntity {
    hp: number;
    maxHp: number;
}

export interface Player extends Entity {
    mana: number;
    maxMana: number;
}

export type RoomType = 'Start' | 'Normal' | 'Boss' | 'Treasure' | 'Shop';
export type Direction = 'Top' | 'Bottom' | 'Left' | 'Right';

export interface RoomState {
    gridX: number;  
    gridY: number;
    isClear: boolean;
    hasDoors: {[key in Direction]: boolean};
    obstacles: BaseNetworkEntity[];
    chests: BaseNetworkEntity[];
    respawnedEntities: Entity[];
    enemies: Entity[];
    distanceToSpawn: number;
    type: RoomType;
}

export interface VectorXY {
    x: number;
    y: number;
}

export interface LoginData {
    login: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    refreshToken?: string;
    login?: string;
    message: string;
}

export interface LogoutRequest {
    token: string;
}

export interface LogoutResponse {
    success: boolean;
    message: string;
}

export interface PlayerSnapshot {
    id: string;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    mana: number;
    maxMana: number;
    sprite: string;
}

export interface EnemySnapshot {
    id: string;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    sprite: string;
}

export interface BulletSnapshot {
    id: string;
    x: number;
    y: number;
}

export interface RoomSnapshot {
    gridX: number;
    gridY: number;
    isClear: boolean;
    hasDoors: { Top: boolean; Bottom: boolean; Left: boolean; Right: boolean };
    type: RoomType;
    enemies: EnemySnapshot[];
}

export interface GameSnapshot {
    players: Player[];
    room: ServerRoomState;
    bullets: Bullet[];
}

export interface SessionCreateRequest {
    token: string;
    archetype: string;
    weaponId: string;
}

export interface SessionCreateResponse {
    success: boolean;
    sessionId?: string;
    message?: string;
}

export interface SessionJoinResponse {
    success: boolean;
    sessionId?: string;
    message?: string;
}

export interface SessionJoinRequest {
    sessionId: string;
    token: string;
    archetype: string;
    weaponId: string;
}