"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoundingBoxSchema = exports.VectorXYSchema = void 0;
const zod_1 = require("zod");
exports.VectorXYSchema = zod_1.z.object({
    x: zod_1.z.number(),
    y: zod_1.z.number()
});
exports.BoundingBoxSchema = zod_1.z.object({
    left: zod_1.z.number(),
    right: zod_1.z.number(),
    top: zod_1.z.number(),
    bottom: zod_1.z.number()
});
