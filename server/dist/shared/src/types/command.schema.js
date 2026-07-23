"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerCommandSchema = void 0;
const zod_1 = require("zod");
exports.PlayerCommandSchema = zod_1.z.object({
    up: zod_1.z.boolean(),
    down: zod_1.z.boolean(),
    left: zod_1.z.boolean(),
    right: zod_1.z.boolean(),
    attack: zod_1.z.boolean(),
    interact: zod_1.z.boolean(),
    weapon1: zod_1.z.boolean(),
    weapon2: zod_1.z.boolean(),
    weapon3: zod_1.z.boolean()
});
