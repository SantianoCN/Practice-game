"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChestPresetSchema = void 0;
const zod_1 = require("zod");
exports.ChestPresetSchema = zod_1.z.object({
    id: zod_1.z.string(),
    visualIdClosed: zod_1.z.string(),
    visualIdOpened: zod_1.z.string(),
    lootTableId: zod_1.z.string(),
    width: zod_1.z.number(),
    height: zod_1.z.number()
});
