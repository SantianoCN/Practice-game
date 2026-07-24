import { z } from 'zod';
export declare const PlayerCommandSchema: z.ZodObject<{
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
export type PlayerCommand = z.infer<typeof PlayerCommandSchema>;
