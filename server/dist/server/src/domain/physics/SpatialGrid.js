"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpatialGrid = void 0;
class SpatialGrid {
    cellSize;
    cells = new Map();
    constructor(cellSize) {
        this.cellSize = cellSize;
    }
    getCellKey(cx, cy) {
        return `${cx}:${cy}`;
    }
    insert(entity) {
        const bounds = entity.getBounds();
        const startX = Math.floor(bounds.left / this.cellSize);
        const endX = Math.floor(bounds.right / this.cellSize);
        const startY = Math.floor(bounds.top / this.cellSize);
        const endY = Math.floor(bounds.bottom / this.cellSize);
        for (let cx = startX; cx <= endX; cx++) {
            for (let cy = startY; cy <= endY; cy++) {
                const key = this.getCellKey(cx, cy);
                let cell = this.cells.get(key);
                if (!cell) {
                    cell = [];
                    this.cells.set(key, cell);
                }
                cell.push(entity);
            }
        }
    }
    query(bounds) {
        const result = new Set();
        const startX = Math.floor(bounds.left / this.cellSize);
        const endX = Math.floor(bounds.right / this.cellSize);
        const startY = Math.floor(bounds.top / this.cellSize);
        const endY = Math.floor(bounds.bottom / this.cellSize);
        for (let cx = startX; cx <= endX; cx++) {
            for (let cy = startY; cy <= endY; cy++) {
                const key = this.getCellKey(cx, cy);
                const cell = this.cells.get(key);
                if (cell) {
                    for (const entity of cell) {
                        result.add(entity);
                    }
                }
            }
        }
        return result;
    }
}
exports.SpatialGrid = SpatialGrid;
