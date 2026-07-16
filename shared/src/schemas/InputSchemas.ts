import { z } from 'zod';

export const LoginDataSchema = z.object({
    login: z.string().min(3).max(20),
    password: z.string().min(4)
});

export const TokenRequestSchema = z.object({
    token: z.string()
});

export const SessionCreateRequestSchema = z.object({
    token: z.string(),
    archetype: z.string(),
    weaponId: z.string()
});

export const SessionJoinRequestSchema = z.object({
    sessionId: z.string(),
    token: z.string(),
    archetype: z.string(),
    weaponId: z.string()
});

export const PlayerActionSchema = z.object({
    keys: z.object({
        up: z.boolean(),
        down: z.boolean(),
        left: z.boolean(),
        right: z.boolean(),
        attack: z.boolean(),
        weapon1: z.boolean(),
        weapon2: z.boolean(),
        weapon3: z.boolean()
    })
});