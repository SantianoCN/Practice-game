import { z } from 'zod';

export const PlayerCommandSchema = z.object({
    up: z.boolean(),
    down: z.boolean(),
    left: z.boolean(),
    right: z.boolean(),
    attack: z.boolean(),
    interact: z.boolean(),
    weapon1: z.boolean(),
    weapon2: z.boolean(),
    weapon3: z.boolean()
});
export type PlayerCommand = z.infer<typeof PlayerCommandSchema>;