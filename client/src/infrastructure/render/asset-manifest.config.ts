import {
    CHESTS_DATABASE,
    ITEMS_DATABASE,
    WARRIOR_PRESET,
    MAGE_PRESET,
    WARRIOR_PRESET_LIZARD,
    MAGE_PRESET_LIZARD,
    STARTING_SWORD,
    STARTING_AXE,
    STARTING_STAFF,
    STARTING_ICE_STAFF,
    FIREBALL,
    ICE_BALL,
    SLASH,
    AXE_SLASH,
} from '@game/shared';
import { ASSETS } from './../../../assets';

export const DEFAULT_SIZES = {
    droppedItem: 24,
    obstacleTile: 20,
    floorTile: 20,
} as const;

export interface StaticAssetEntry {
    visualId: string;
    src: string;
    width: number;
    height: number;
    mode?: 'stretch' | 'tiled';
}

const CHEST_ASSETS: StaticAssetEntry[] = Object.values(CHESTS_DATABASE).flatMap(preset => [
    { visualId: preset.visualIdClosed, src: ASSETS.env.chest, width: preset.width, height: preset.height },
    { visualId: preset.visualIdOpened, src: ASSETS.env.chestOpen, width: preset.width, height: preset.height },
]);

const ITEM_ASSET_SOURCES: Record<string, string> = {
    wpn_iron_sword: ASSETS.weapon.ironSword,
    wpn_heavy_axe: ASSETS.weapon.battleAxe,
    wpn_fire_staff: ASSETS.weapon.fireStaff,
    wpn_ice_staff: ASSETS.weapon.iceStaff,
    gold_coins: ASSETS.loot.coin,
    pot_heal: ASSETS.loot.potionRed
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

export const STATIC_ASSET_MANIFEST: StaticAssetEntry[] = [
    ...CHEST_ASSETS,
    ...ITEM_ASSETS,
    ...OBSTACLE_ASSETS,
];
export const FLOOR_TILE_ASSETS: string[] = [
    ASSETS.env.caveTile1,
    ASSETS.env.caveTile2,
    ASSETS.env.caveTile3,
    ASSETS.env.caveTile4,
];

export interface PlayerVisualVariant {
    weaponVisualId: string;
    src: string;
}
export interface PlayerVisualEntry {
    visualId: string;
    variants: PlayerVisualVariant[];
}

export const PLAYER_VISUAL_MANIFEST: PlayerVisualEntry[] = [
    {
        visualId: WARRIOR_PRESET.visualId,
        variants: [
            { weaponVisualId: STARTING_SWORD.config.visualId, src: ASSETS.hero.warriorSword },
            { weaponVisualId: STARTING_AXE.config.visualId, src: ASSETS.hero.warriorAxe },
        ],
    },
    {
        visualId: MAGE_PRESET.visualId,
        variants: [
            { weaponVisualId: STARTING_STAFF.config.visualId, src: ASSETS.hero.volhvFire },
            { weaponVisualId: STARTING_ICE_STAFF.config.visualId, src: ASSETS.hero.volhvIce },
        ],
    },
];

export interface EnemyVisualEntry {
    visualId: string;
    src: string;
}

export const ENEMY_VISUAL_MANIFEST: EnemyVisualEntry[] = [
    { visualId: WARRIOR_PRESET_LIZARD.visualId, src: ASSETS.enemy.lizardAxe },
    { visualId: MAGE_PRESET_LIZARD.visualId, src: ASSETS.enemy.lizardMage },
];

export type ProjectileRenderMode =
    | { kind: 'orb'; color: string }
    | { kind: 'axe-arc'; color: string }
    | { kind: 'sword-slash'; color: string };

export const PROJECTILE_VISUAL_MANIFEST: Record<string, ProjectileRenderMode> = {
    [FIREBALL.visualId]: { kind: 'orb', color: 'red' },
    [ICE_BALL.visualId]: { kind: 'orb', color: 'blue' },
    [SLASH.visualId]: { kind: 'sword-slash', color: '#00d2d3' },
    [AXE_SLASH.visualId]: { kind: 'axe-arc', color: '#e67e22' },
};

export const DEFAULT_PROJECTILE_VISUAL: ProjectileRenderMode = { kind: 'orb', color: 'black' };