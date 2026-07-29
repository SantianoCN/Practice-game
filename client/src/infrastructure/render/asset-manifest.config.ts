import {
    CHESTS_DATABASE,
    ITEMS_DATABASE,
    WARRIOR_PRESET,
    MAGE_PRESET,
    ARCHER_PRESET,
    FIREBALL,
    ICE_BALL,
    SLASH,
    AXE_SLASH,
    POISON_DART,
    LIGHTNING,
    GAME_CONFIG
} from '@game/shared';
import { ASSETS } from './../../../assets';

export const DEFAULT_SIZES = {
    droppedItem: GAME_CONFIG.CELL_SIZE,
    obstacleTile: GAME_CONFIG.CELL_SIZE,
    floorTile: GAME_CONFIG.CELL_SIZE,
} as const;

export interface StaticAssetEntry {
    visualId: string;
    src: string;
    width: number;
    height: number;
    mode?: 'stretch' | 'tiled';
}

const CHEST_ASSET_SOURCES: Record<string, string> = {
    chest_wooden_closed: ASSETS.env.chest,
    chest_wooden_opened: ASSETS.env.chestOpen,
    chest_gold_closed: ASSETS.env.chest,
    chest_gold_opened: ASSETS.env.chestOpen,
};

const CHEST_ASSETS: StaticAssetEntry[] = Object.values(CHESTS_DATABASE).flatMap(preset => [
    { 
        visualId: preset.visualIdClosed, 
        src: CHEST_ASSET_SOURCES[preset.visualIdClosed] || ASSETS.env.chest, 
        width: preset.width, 
        height: preset.height 
    },
    { 
        visualId: preset.visualIdOpened, 
        src: CHEST_ASSET_SOURCES[preset.visualIdOpened] || ASSETS.env.chestOpen, 
        width: preset.width, 
        height: preset.height 
    },
]);

const ITEM_ASSET_SOURCES: Record<string, string> = {
    wpn_iron_sword: ASSETS.weapon.ironSword,
    wpn_heavy_axe: ASSETS.weapon.battleAxe,
    wpn_fire_staff: ASSETS.weapon.fireStaff,
    wpn_ice_staff: ASSETS.weapon.iceStaff,
    wpn_lightning_staff: ASSETS.weapon.lightningStaff,
    wpn_hunter_bow: ASSETS.weapon.hunterBow,
    wpn_boss_staff: ASSETS.weapon.fireStaff,
    gold_coins: ASSETS.loot.coin,
    pot_heal: ASSETS.loot.potionRed,
    pot_mana: ASSETS.loot.potionBlue,
    pot_rejuv: ASSETS.loot.potionGreen,
    pot_speed: ASSETS.loot.potionYellow
};

const ITEM_ASSETS: StaticAssetEntry[] = Object.values(ITEMS_DATABASE)
    .map((item): StaticAssetEntry | null => {
        const src = ITEM_ASSET_SOURCES[item.id];
        if (!src) {
            console.warn(`[asset-manifest] Нет ассета для предмета "${item.id}" (visualId: ${item.visualId})`);
            return null;
        }
        return { 
            visualId: item.visualId, 
            src, 
            width: item.dropWidth ?? DEFAULT_SIZES.droppedItem, 
            height: item.dropHeight ?? DEFAULT_SIZES.droppedItem 
        };
    })
    .filter((entry): entry is StaticAssetEntry => entry !== null);

const OBSTACLE_ASSETS: StaticAssetEntry[] = [
    {
        visualId: 'stone',
        src: ASSETS.env.stone,
        width: DEFAULT_SIZES.obstacleTile,
        height: DEFAULT_SIZES.obstacleTile,
        mode: 'tiled',
    },
];

export const PROJECTILE_ASSET_MANIFEST: StaticAssetEntry[] = [
    { visualId: SLASH.visualId, src: ASSETS.particle.swordSlash, width: 20, height: 45 },
    { visualId: AXE_SLASH.visualId, src: ASSETS.particle.axeSlash, width: 24, height: 45 },
    { visualId: FIREBALL.visualId, src: ASSETS.particle.fireball, width: 30, height: 14 },
    { visualId: ICE_BALL.visualId, src: ASSETS.particle.iceball, width: 30, height: 14 },
    { visualId: LIGHTNING.visualId, src: ASSETS.particle.lightning, width: 30, height: 14 },
    { visualId: POISON_DART.visualId, src: ASSETS.particle.arrow, width: 30, height: 12 },
];

export const STATIC_ASSET_MANIFEST: StaticAssetEntry[] = [
    ...CHEST_ASSETS,
    ...ITEM_ASSETS,
    ...OBSTACLE_ASSETS,
    ...PROJECTILE_ASSET_MANIFEST
];

export const FLOOR_TILE_ASSETS: string[] = [
    ASSETS.env.caveTile1,
    ASSETS.env.caveTile2,
    ASSETS.env.caveTile3,
    ASSETS.env.caveTile4,
];

export interface LivingEntityVisualEntry {
    visualId: string;
    src: string;
    idleSrc?: string;
}

export const LIVING_VISUAL_MANIFEST: LivingEntityVisualEntry[] = [
    {
        visualId: WARRIOR_PRESET.visualId,
        src: ASSETS.hero.warriorMove,
        idleSrc: ASSETS.hero.warriorIdle,
    },
    {
        visualId: MAGE_PRESET.visualId,
        src: ASSETS.hero.mageMove,
        idleSrc: ASSETS.hero.mageIdle,
    },
    {
        visualId: ARCHER_PRESET.visualId,
        src: ASSETS.hero.hunterMove,
        idleSrc: ASSETS.hero.hunterIdle,
    },
    {
        visualId: 'lizard',
        src: ASSETS.enemy.lizardMove,
        idleSrc: ASSETS.enemy.lizardIdle,
    }
];