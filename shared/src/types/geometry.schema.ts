import { z } from 'zod';

export const VectorXYSchema = z.object({
    x: z.number(),
    y: z.number()
});
export type VectorXY = z.infer<typeof VectorXYSchema>;

export const BoundingBoxSchema = z.object({
    left: z.number(),
    right: z.number(),
    top: z.number(),
    bottom: z.number()
});
export type BoundingBox = z.infer<typeof BoundingBoxSchema>;