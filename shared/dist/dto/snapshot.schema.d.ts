import { z } from 'zod';
export declare const GameSnapshotSchema: z.ZodObject<{
    room: z.ZodObject<{
        gridX: z.ZodNumber;
        gridY: z.ZodNumber;
        isClear: z.ZodBoolean;
        type: z.ZodEnum<["Start", "Normal", "Boss", "Treasure", "Shop"]>;
        hasDoors: z.ZodObject<{
            Top: z.ZodBoolean;
            Bottom: z.ZodBoolean;
            Left: z.ZodBoolean;
            Right: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            Top: boolean;
            Bottom: boolean;
            Left: boolean;
            Right: boolean;
        }, {
            Top: boolean;
            Bottom: boolean;
            Left: boolean;
            Right: boolean;
        }>;
        chests: z.ZodArray<z.ZodObject<{
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
        }>, "many">;
        droppedItems: z.ZodArray<z.ZodObject<{
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
        }>, "many">;
        portal: z.ZodOptional<z.ZodNullable<z.ZodObject<{
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
        }>>>;
    }, "strip", z.ZodTypeAny, {
        type: "Start" | "Normal" | "Boss" | "Treasure" | "Shop";
        gridX: number;
        gridY: number;
        isClear: boolean;
        hasDoors: {
            Top: boolean;
            Bottom: boolean;
            Left: boolean;
            Right: boolean;
        };
        chests: {
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
        }[];
        droppedItems: {
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
        }[];
        portal?: {
            visualId: string;
            width: number;
            height: number;
            id: string;
            x: number;
            y: number;
            isActive: boolean;
        } | null | undefined;
    }, {
        type: "Start" | "Normal" | "Boss" | "Treasure" | "Shop";
        gridX: number;
        gridY: number;
        isClear: boolean;
        hasDoors: {
            Top: boolean;
            Bottom: boolean;
            Left: boolean;
            Right: boolean;
        };
        chests: {
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
        }[];
        droppedItems: {
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
        }[];
        portal?: {
            visualId: string;
            width: number;
            height: number;
            id: string;
            x: number;
            y: number;
            isActive: boolean;
        } | null | undefined;
    }>;
    players: z.ZodArray<z.ZodObject<{
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
    }>, "many">;
    enemies: z.ZodArray<z.ZodObject<{
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
    }>, "many">;
    bullets: z.ZodArray<z.ZodObject<{
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
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    room: {
        type: "Start" | "Normal" | "Boss" | "Treasure" | "Shop";
        gridX: number;
        gridY: number;
        isClear: boolean;
        hasDoors: {
            Top: boolean;
            Bottom: boolean;
            Left: boolean;
            Right: boolean;
        };
        chests: {
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
        }[];
        droppedItems: {
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
        }[];
        portal?: {
            visualId: string;
            width: number;
            height: number;
            id: string;
            x: number;
            y: number;
            isActive: boolean;
        } | null | undefined;
    };
    players: {
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
    }[];
    enemies: {
        maxHp: number;
        visualId: string;
        width: number;
        height: number;
        id: string;
        x: number;
        y: number;
        hp: number;
    }[];
    bullets: {
        speed: number;
        visualId: string;
        width: number;
        height: number;
        id: string;
        x: number;
        y: number;
    }[];
}, {
    room: {
        type: "Start" | "Normal" | "Boss" | "Treasure" | "Shop";
        gridX: number;
        gridY: number;
        isClear: boolean;
        hasDoors: {
            Top: boolean;
            Bottom: boolean;
            Left: boolean;
            Right: boolean;
        };
        chests: {
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
        }[];
        droppedItems: {
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
        }[];
        portal?: {
            visualId: string;
            width: number;
            height: number;
            id: string;
            x: number;
            y: number;
            isActive: boolean;
        } | null | undefined;
    };
    players: {
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
    }[];
    enemies: {
        maxHp: number;
        visualId: string;
        width: number;
        height: number;
        id: string;
        x: number;
        y: number;
        hp: number;
    }[];
    bullets: {
        speed: number;
        visualId: string;
        width: number;
        height: number;
        id: string;
        x: number;
        y: number;
    }[];
}>;
export type GameSnapshotDTO = z.infer<typeof GameSnapshotSchema>;
