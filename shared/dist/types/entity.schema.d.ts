import { z } from 'zod';
export declare const BaseEntityStateSchema: z.ZodObject<{
    id: z.ZodString;
    x: z.ZodNumber;
    y: z.ZodNumber;
    width: z.ZodNumber;
    height: z.ZodNumber;
    visualId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    visualId: string;
    width: number;
    height: number;
    id: string;
    x: number;
    y: number;
}, {
    visualId: string;
    width: number;
    height: number;
    id: string;
    x: number;
    y: number;
}>;
export type BaseEntityState = z.infer<typeof BaseEntityStateSchema>;
export declare const PlayerStateSchema: z.ZodObject<{
    id: z.ZodString;
    x: z.ZodNumber;
    y: z.ZodNumber;
    width: z.ZodNumber;
    height: z.ZodNumber;
    visualId: z.ZodString;
} & {
    hp: z.ZodNumber;
    maxHp: z.ZodNumber;
    mana: z.ZodNumber;
    maxMana: z.ZodNumber;
    gold: z.ZodNumber;
    activeWeaponVisualId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    maxHp: number;
    maxMana: number;
    visualId: string;
    width: number;
    height: number;
    gold: number;
    id: string;
    x: number;
    y: number;
    hp: number;
    mana: number;
    activeWeaponVisualId: string;
}, {
    maxHp: number;
    maxMana: number;
    visualId: string;
    width: number;
    height: number;
    gold: number;
    id: string;
    x: number;
    y: number;
    hp: number;
    mana: number;
    activeWeaponVisualId: string;
}>;
export type PlayerState = z.infer<typeof PlayerStateSchema>;
export declare const EnemyStateSchema: z.ZodObject<{
    id: z.ZodString;
    x: z.ZodNumber;
    y: z.ZodNumber;
    width: z.ZodNumber;
    height: z.ZodNumber;
    visualId: z.ZodString;
} & {
    hp: z.ZodNumber;
    maxHp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    maxHp: number;
    visualId: string;
    width: number;
    height: number;
    id: string;
    x: number;
    y: number;
    hp: number;
}, {
    maxHp: number;
    visualId: string;
    width: number;
    height: number;
    id: string;
    x: number;
    y: number;
    hp: number;
}>;
export type EnemyState = z.infer<typeof EnemyStateSchema>;
export declare const BulletStateSchema: z.ZodObject<{
    id: z.ZodString;
    x: z.ZodNumber;
    y: z.ZodNumber;
    width: z.ZodNumber;
    height: z.ZodNumber;
    visualId: z.ZodString;
} & {
    speed: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    speed: number;
    visualId: string;
    width: number;
    height: number;
    id: string;
    x: number;
    y: number;
}, {
    speed: number;
    visualId: string;
    width: number;
    height: number;
    id: string;
    x: number;
    y: number;
}>;
export type BulletState = z.infer<typeof BulletStateSchema>;
export declare const ChestStateSchema: z.ZodObject<{
    id: z.ZodString;
    x: z.ZodNumber;
    y: z.ZodNumber;
    width: z.ZodNumber;
    height: z.ZodNumber;
    visualId: z.ZodString;
} & {
    gridX: z.ZodNumber;
    gridY: z.ZodNumber;
    isOpened: z.ZodBoolean;
    presetId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    visualId: string;
    width: number;
    height: number;
    id: string;
    x: number;
    y: number;
    gridX: number;
    gridY: number;
    isOpened: boolean;
    presetId: string;
}, {
    visualId: string;
    width: number;
    height: number;
    id: string;
    x: number;
    y: number;
    gridX: number;
    gridY: number;
    isOpened: boolean;
    presetId: string;
}>;
export type ChestState = z.infer<typeof ChestStateSchema>;
export declare const DroppedItemStateSchema: z.ZodObject<{
    id: z.ZodString;
    x: z.ZodNumber;
    y: z.ZodNumber;
    width: z.ZodNumber;
    height: z.ZodNumber;
    visualId: z.ZodString;
} & {
    presetId: z.ZodString;
    onPickup: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"heal">;
        value: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        value: number;
        type: "heal";
    }, {
        value: number;
        type: "heal";
    }>, z.ZodObject<{
        type: z.ZodLiteral<"add_gold">;
        value: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        value: number;
        type: "add_gold";
    }, {
        value: number;
        type: "add_gold";
    }>, z.ZodObject<{
        type: z.ZodLiteral<"equip_weapon">;
        weaponPresetId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "equip_weapon";
        weaponPresetId: string;
    }, {
        type: "equip_weapon";
        weaponPresetId: string;
    }>]>, "many">;
}, "strip", z.ZodTypeAny, {
    visualId: string;
    width: number;
    height: number;
    id: string;
    x: number;
    y: number;
    presetId: string;
    onPickup: ({
        value: number;
        type: "heal";
    } | {
        value: number;
        type: "add_gold";
    } | {
        type: "equip_weapon";
        weaponPresetId: string;
    })[];
}, {
    visualId: string;
    width: number;
    height: number;
    id: string;
    x: number;
    y: number;
    presetId: string;
    onPickup: ({
        value: number;
        type: "heal";
    } | {
        value: number;
        type: "add_gold";
    } | {
        type: "equip_weapon";
        weaponPresetId: string;
    })[];
}>;
export type DroppedItemState = z.infer<typeof DroppedItemStateSchema>;
export declare const ObstacleStateSchema: z.ZodObject<{
    id: z.ZodString;
    x: z.ZodNumber;
    y: z.ZodNumber;
    width: z.ZodNumber;
    height: z.ZodNumber;
    visualId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    visualId: string;
    width: number;
    height: number;
    id: string;
    x: number;
    y: number;
}, {
    visualId: string;
    width: number;
    height: number;
    id: string;
    x: number;
    y: number;
}>;
export type ObstacleState = z.infer<typeof ObstacleStateSchema>;
export declare const PortalStateSchema: z.ZodObject<{
    id: z.ZodString;
    x: z.ZodNumber;
    y: z.ZodNumber;
    width: z.ZodNumber;
    height: z.ZodNumber;
    visualId: z.ZodString;
} & {
    isActive: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    visualId: string;
    width: number;
    height: number;
    id: string;
    x: number;
    y: number;
    isActive: boolean;
}, {
    visualId: string;
    width: number;
    height: number;
    id: string;
    x: number;
    y: number;
    isActive: boolean;
}>;
export type PortalState = z.infer<typeof PortalStateSchema>;
