"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaticPresetProvider = void 0;
const shared_1 = require("@game/shared");
class StaticPresetProvider {
    getChestPreset(id) {
        return shared_1.CHESTS_DATABASE[id] || null;
    }
    getLootTable(id) {
        return shared_1.LOOT_TABLES_DATABASE[id] || null;
    }
    getItemPreset(id) {
        return shared_1.ITEMS_DATABASE[id] || null;
    }
}
exports.StaticPresetProvider = StaticPresetProvider;
