import { RoomType } from "./RoomTypes"

export interface BaseEntity {
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    sprite: string
};

export interface DroppedItemSnapshot extends BaseEntity { }
export interface BulletSnapshot extends BaseEntity { }

export interface RoomSnapshot {
    gridX: number,
    gridY: number,
    isClear: boolean,
    hasDoors: {
        Top: boolean,
        Bottom: boolean,
        Left: boolean,
        Right: boolean
    },
    type: RoomType,
    obstacles: (BaseEntity),
    chests: (ChestSnapshot),
    droppedItems: (DroppedItemSnapshot)
};

export interface ChestSnapshot extends BaseEntity{
    isOpened: boolean,
    gridX: number,
    gridY: number
};

export interface PlayerSnapshot extends BaseEntity { 
    hp: number,
    maxHp: number,
    mana: number,
    maxMana: number
};

export interface EnemySnapshot extends BaseEntity {
    hp: number,
    maxHp: number
};

export interface GameSnapshot {
    room: RoomSnapshot,
    players: PlayerSnapshot,
    enemies: EnemySnapshot,
    bullets: BulletSnapshot
};