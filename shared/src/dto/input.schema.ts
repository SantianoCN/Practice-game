import { z } from 'zod';
import { ArchetypeSchema } from '../types/stats.schema';

export const LoginDataSchema = z.object({
    login: z.string().min(3).max(20),
    password: z.string().min(4)
});
export type LoginDataDTO = z.infer<typeof LoginDataSchema>;

export const TokenRequestSchema = z.object({
    token: z.string()
});
export type TokenRequestDTO = z.infer<typeof TokenRequestSchema>;

export const SessionCreateRequestSchema = z.object({
    token: z.string(),
    archetype: ArchetypeSchema,
    weaponId: z.string()
});
export type SessionCreateRequestDTO = z.infer<typeof SessionCreateRequestSchema>;

export const SessionJoinRequestSchema = z.object({
    sessionId: z.string(),
    token: z.string(),
    archetype: ArchetypeSchema,
    weaponId: z.string()
});
export type SessionJoinRequestDTO = z.infer<typeof SessionJoinRequestSchema>;

export const PlayerActionSchema = z.object({
    keys: z.object({
        up: z.boolean(),
        down: z.boolean(),
        left: z.boolean(),
        right: z.boolean(),
        attack: z.boolean(),
        weapon1: z.boolean(),
        weapon2: z.boolean(),
        weapon3: z.boolean(),
        interact: z.boolean()
    })
});
export type PlayerActionDTO = z.infer<typeof PlayerActionSchema>;

export interface BaseResponseDTO {
    success: boolean;
    message?: string;
}

export interface LoginResponseDTO extends BaseResponseDTO {
    refreshToken?: string;
    login?: string;
}

export interface LogoutResponseDTO extends BaseResponseDTO {}

export interface SessionCreateResponseDTO extends BaseResponseDTO {
    sessionId?: string;
}

export interface SessionJoinResponseDTO extends BaseResponseDTO {
    sessionId?: string;
}

export interface ProfileResponseDTO extends BaseResponseDTO {
    login?: string;
}