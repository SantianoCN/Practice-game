import { z } from 'zod';
export declare const LoginDataSchema: z.ZodObject<{
    login: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    login: string;
    password: string;
}, {
    login: string;
    password: string;
}>;
export type LoginDataDTO = z.infer<typeof LoginDataSchema>;
export declare const TokenRequestSchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
export type TokenRequestDTO = z.infer<typeof TokenRequestSchema>;
export declare const PlayerProgressSchema: z.ZodObject<{
    metaGold: z.ZodNumber;
    unlockedClasses: z.ZodArray<z.ZodString, "many">;
    unlockedWeapons: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    metaGold: number;
    unlockedClasses: string[];
    unlockedWeapons: string[];
}, {
    metaGold: number;
    unlockedClasses: string[];
    unlockedWeapons: string[];
}>;
export type PlayerProgressDTO = z.infer<typeof PlayerProgressSchema>;
export declare const BuyItemRequestSchema: z.ZodObject<{
    itemPresetId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    itemPresetId: string;
}, {
    itemPresetId: string;
}>;
export type BuyItemRequestDTO = z.infer<typeof BuyItemRequestSchema>;
export declare const SessionCreateRequestSchema: z.ZodObject<{
    token: z.ZodString;
    archetype: z.ZodEnum<["warrior", "mage"]>;
    weaponId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    archetype: "warrior" | "mage";
    token: string;
    weaponId: string;
}, {
    archetype: "warrior" | "mage";
    token: string;
    weaponId: string;
}>;
export type SessionCreateRequestDTO = z.infer<typeof SessionCreateRequestSchema>;
export declare const SessionJoinRequestSchema: z.ZodObject<{
    sessionId: z.ZodString;
    token: z.ZodString;
    archetype: z.ZodEnum<["warrior", "mage"]>;
    weaponId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    archetype: "warrior" | "mage";
    token: string;
    weaponId: string;
    sessionId: string;
}, {
    archetype: "warrior" | "mage";
    token: string;
    weaponId: string;
    sessionId: string;
}>;
export type SessionJoinRequestDTO = z.infer<typeof SessionJoinRequestSchema>;
export declare const PlayerActionSchema: z.ZodObject<{
    keys: z.ZodObject<{
        up: z.ZodBoolean;
        down: z.ZodBoolean;
        left: z.ZodBoolean;
        right: z.ZodBoolean;
        attack: z.ZodBoolean;
        interact: z.ZodBoolean;
        weapon1: z.ZodBoolean;
        weapon2: z.ZodBoolean;
        weapon3: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        left: boolean;
        right: boolean;
        up: boolean;
        down: boolean;
        attack: boolean;
        interact: boolean;
        weapon1: boolean;
        weapon2: boolean;
        weapon3: boolean;
    }, {
        left: boolean;
        right: boolean;
        up: boolean;
        down: boolean;
        attack: boolean;
        interact: boolean;
        weapon1: boolean;
        weapon2: boolean;
        weapon3: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    keys: {
        left: boolean;
        right: boolean;
        up: boolean;
        down: boolean;
        attack: boolean;
        interact: boolean;
        weapon1: boolean;
        weapon2: boolean;
        weapon3: boolean;
    };
}, {
    keys: {
        left: boolean;
        right: boolean;
        up: boolean;
        down: boolean;
        attack: boolean;
        interact: boolean;
        weapon1: boolean;
        weapon2: boolean;
        weapon3: boolean;
    };
}>;
export type PlayerActionDTO = z.infer<typeof PlayerActionSchema>;
export interface BaseResponseDTO {
    success: boolean;
    message?: string;
}
export interface LoginResponseDTO extends BaseResponseDTO {
    refreshToken?: string;
    login?: string;
    progress?: PlayerProgressDTO;
}
export interface LogoutResponseDTO extends BaseResponseDTO {
}
export interface SessionCreateResponseDTO extends BaseResponseDTO {
    sessionId?: string;
}
export interface SessionJoinResponseDTO extends BaseResponseDTO {
    sessionId?: string;
}
export interface ProfileResponseDTO extends BaseResponseDTO {
    login?: string;
    progress?: PlayerProgressDTO;
}
export interface BuyItemResponseDTO extends BaseResponseDTO {
    progress?: PlayerProgressDTO;
}
