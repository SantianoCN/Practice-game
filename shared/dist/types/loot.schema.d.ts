import { z } from 'zod';
export declare const ItemTypeSchema: z.ZodEnum<["weapon", "gold", "consumable"]>;
export type ItemType = z.infer<typeof ItemTypeSchema>;
export declare const GameEffectSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
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
}>]>;
export type GameEffect = z.infer<typeof GameEffectSchema>;
export declare const ItemPresetSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    visualId: z.ZodString;
    dropWidth: z.ZodOptional<z.ZodNumber>;
    dropHeight: z.ZodOptional<z.ZodNumber>;
    effects: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
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
    }>]>, "many">>;
} & {
    type: z.ZodLiteral<"gold">;
    stats: z.ZodOptional<z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>>;
}, "strip", z.ZodTypeAny, {
    type: "gold";
    visualId: string;
    name: string;
    id: string;
    stats?: {} | undefined;
    dropWidth?: number | undefined;
    dropHeight?: number | undefined;
    effects?: ({
        value: number;
        type: "heal";
    } | {
        value: number;
        type: "add_gold";
    } | {
        type: "equip_weapon";
        weaponPresetId: string;
    })[] | undefined;
}, {
    type: "gold";
    visualId: string;
    name: string;
    id: string;
    stats?: {} | undefined;
    dropWidth?: number | undefined;
    dropHeight?: number | undefined;
    effects?: ({
        value: number;
        type: "heal";
    } | {
        value: number;
        type: "add_gold";
    } | {
        type: "equip_weapon";
        weaponPresetId: string;
    })[] | undefined;
}>, z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    visualId: z.ZodString;
    dropWidth: z.ZodOptional<z.ZodNumber>;
    dropHeight: z.ZodOptional<z.ZodNumber>;
    effects: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
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
    }>]>, "many">>;
} & {
    type: z.ZodLiteral<"consumable">;
    stats: z.ZodObject<{
        healAmount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        healAmount: number;
    }, {
        healAmount: number;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "consumable";
    visualId: string;
    name: string;
    stats: {
        healAmount: number;
    };
    id: string;
    dropWidth?: number | undefined;
    dropHeight?: number | undefined;
    effects?: ({
        value: number;
        type: "heal";
    } | {
        value: number;
        type: "add_gold";
    } | {
        type: "equip_weapon";
        weaponPresetId: string;
    })[] | undefined;
}, {
    type: "consumable";
    visualId: string;
    name: string;
    stats: {
        healAmount: number;
    };
    id: string;
    dropWidth?: number | undefined;
    dropHeight?: number | undefined;
    effects?: ({
        value: number;
        type: "heal";
    } | {
        value: number;
        type: "add_gold";
    } | {
        type: "equip_weapon";
        weaponPresetId: string;
    })[] | undefined;
}>, z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    visualId: z.ZodString;
    dropWidth: z.ZodOptional<z.ZodNumber>;
    dropHeight: z.ZodOptional<z.ZodNumber>;
    effects: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
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
    }>]>, "many">>;
} & {
    type: z.ZodLiteral<"weapon">;
    stats: z.ZodObject<{
        cooldownMs: z.ZodNumber;
        manaCost: z.ZodNumber;
        projectile: z.ZodObject<{
            radius: z.ZodNumber;
            damage: z.ZodNumber;
            range: z.ZodNumber;
            speed: z.ZodNumber;
            visualId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            speed: number;
            visualId: string;
            radius: number;
            damage: number;
            range: number;
        }, {
            speed: number;
            visualId: string;
            radius: number;
            damage: number;
            range: number;
        }>;
        visualId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        visualId: string;
        cooldownMs: number;
        manaCost: number;
        projectile: {
            speed: number;
            visualId: string;
            radius: number;
            damage: number;
            range: number;
        };
    }, {
        visualId: string;
        cooldownMs: number;
        manaCost: number;
        projectile: {
            speed: number;
            visualId: string;
            radius: number;
            damage: number;
            range: number;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    type: "weapon";
    visualId: string;
    name: string;
    stats: {
        visualId: string;
        cooldownMs: number;
        manaCost: number;
        projectile: {
            speed: number;
            visualId: string;
            radius: number;
            damage: number;
            range: number;
        };
    };
    id: string;
    dropWidth?: number | undefined;
    dropHeight?: number | undefined;
    effects?: ({
        value: number;
        type: "heal";
    } | {
        value: number;
        type: "add_gold";
    } | {
        type: "equip_weapon";
        weaponPresetId: string;
    })[] | undefined;
}, {
    type: "weapon";
    visualId: string;
    name: string;
    stats: {
        visualId: string;
        cooldownMs: number;
        manaCost: number;
        projectile: {
            speed: number;
            visualId: string;
            radius: number;
            damage: number;
            range: number;
        };
    };
    id: string;
    dropWidth?: number | undefined;
    dropHeight?: number | undefined;
    effects?: ({
        value: number;
        type: "heal";
    } | {
        value: number;
        type: "add_gold";
    } | {
        type: "equip_weapon";
        weaponPresetId: string;
    })[] | undefined;
}>]>;
export type ItemPreset = z.infer<typeof ItemPresetSchema>;
export declare const LootTableEntrySchema: z.ZodObject<{
    itemPresetId: z.ZodString;
    weight: z.ZodNumber;
    minQuantity: z.ZodNumber;
    maxQuantity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    itemPresetId: string;
    weight: number;
    minQuantity: number;
    maxQuantity: number;
}, {
    itemPresetId: string;
    weight: number;
    minQuantity: number;
    maxQuantity: number;
}>;
export type LootTableEntry = z.infer<typeof LootTableEntrySchema>;
export declare const LootTableSchema: z.ZodObject<{
    id: z.ZodString;
    rolls: z.ZodNumber;
    entries: z.ZodArray<z.ZodObject<{
        itemPresetId: z.ZodString;
        weight: z.ZodNumber;
        minQuantity: z.ZodNumber;
        maxQuantity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        itemPresetId: string;
        weight: number;
        minQuantity: number;
        maxQuantity: number;
    }, {
        itemPresetId: string;
        weight: number;
        minQuantity: number;
        maxQuantity: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    entries: {
        itemPresetId: string;
        weight: number;
        minQuantity: number;
        maxQuantity: number;
    }[];
    id: string;
    rolls: number;
}, {
    entries: {
        itemPresetId: string;
        weight: number;
        minQuantity: number;
        maxQuantity: number;
    }[];
    id: string;
    rolls: number;
}>;
export type LootTable = z.infer<typeof LootTableSchema>;
