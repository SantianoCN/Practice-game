import { BoundingBox } from '@game/shared';

export class SpatialGrid<T extends { getBounds(): BoundingBox }> {
    private cells = new Map<string, T[]>();

    constructor(private cellSize: number) {}

    private getCellKey(cx: number, cy: number): string {
        return `${cx}:${cy}`;
    }

    public insert(entity: T): void {
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

    public query(bounds: BoundingBox): Set<T> {
        const result = new Set<T>();

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