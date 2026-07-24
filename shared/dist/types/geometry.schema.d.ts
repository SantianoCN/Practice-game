import { z } from 'zod';
export declare const VectorXYSchema: z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    x: number;
    y: number;
}, {
    x: number;
    y: number;
}>;
export type VectorXY = z.infer<typeof VectorXYSchema>;
export declare const BoundingBoxSchema: z.ZodObject<{
    left: z.ZodNumber;
    right: z.ZodNumber;
    top: z.ZodNumber;
    bottom: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    left: number;
    right: number;
    top: number;
    bottom: number;
}, {
    left: number;
    right: number;
    top: number;
    bottom: number;
}>;
export type BoundingBox = z.infer<typeof BoundingBoxSchema>;
