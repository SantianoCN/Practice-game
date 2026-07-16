import { BaseNetworkEntityDTO } from "@game/shared"
import { RoomType } from "./RoomTypes"

export interface BaseNetworkEntity {
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    sprite: string
};

export interface DroppedItemSnapshot extends BaseNetworkEntity { }
export interface BulletSnapshot extends BaseNetworkEntity { }

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
    obstacles: (BaseNetworkEntity),
    chests: (ChestSnapshot),
    droppedItems: (DroppedItemSnapshot)
};

export interface ChestSnapshot extends BaseNetworkEntity{
    isOpened: boolean,
    gridX: number,
    gridY: number
};

export interface PlayerSnapshot extends BaseNetworkEntity { 
    hp: number,
    maxHp: number,
    mana: number,
    maxMana: number
};

export interface EnemySnapshot extends BaseNetworkEntity {
    hp: number,
    maxHp: number
};

export interface GameSnapshot {
    room: RoomSnapshot,
    players: PlayerSnapshot,
    enemies: EnemySnapshot,
    bullets: BulletSnapshot
};