"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DroppedItem = exports.Chest = void 0;
const BaseEntities_1 = require("./BaseEntities");
class Chest extends BaseEntities_1.StaticEntity {
    gridX;
    gridY;
    presetId;
    isOpened = false;
    constructor(id, x, y, width, height, gridX, gridY, presetId) {
        super(id, x, y, width, height, 'chest_closed');
        this.gridX = gridX;
        this.gridY = gridY;
        this.presetId = presetId;
    }
    open(visualIdOpened) {
        if (this.isOpened)
            return;
        this.isOpened = true;
        this.visualId = visualIdOpened;
    }
}
exports.Chest = Chest;
class DroppedItem extends BaseEntities_1.StaticEntity {
    presetId;
    onPickup;
    static PICKUP_WIDTH = 24;
    static PICKUP_HEIGHT = 24;
    constructor(id, x, y, visualId, presetId, onPickup) {
        super(id, x, y, DroppedItem.PICKUP_WIDTH, DroppedItem.PICKUP_HEIGHT, visualId);
        this.presetId = presetId;
        this.onPickup = onPickup;
    }
}
exports.DroppedItem = DroppedItem;
