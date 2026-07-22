"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Obstacle = void 0;
const BaseEntities_1 = require("./BaseEntities");
class Obstacle extends BaseEntities_1.StaticEntity {
    constructor(id, x, y, width, height, visualId = 'black') {
        super(id, x, y, width, height, visualId);
    }
}
exports.Obstacle = Obstacle;
