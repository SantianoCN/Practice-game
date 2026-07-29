import { read } from "fs";
import { Obstacle } from "../entities/Obstacle";
import { GAME_CONFIG } from "../../../../shared/src/config/game.config"

export interface Position {
    x: number;
    y: number;
}

export default class EnemyPathFinder {
    public static readonly ENTITY_RADIUS = 20;

    public static hasLineOfSight(
        x1: number, y1: number,
        x2: number, y2: number,
        roomWidth: number,
        roomHeight: number,
        obstacles: Obstacle[]
    ): boolean {
        for (const ob of obstacles) {
            if (this.lineIntersectsBoxWithoutBorder(x1, y1, x2, y2, ob)) return false;
        }
        if (x1 < 0 || x1 > roomWidth || x2 < 0 || x2 > roomWidth ||
            y1 < 0 || y1 > roomHeight || y2 < 0 || y2 > roomHeight) return false;
        return true;
    }

    public static isWalkable(
        x: number, y: number,
        obstacles: readonly Obstacle[],
        roomWidth: number, roomHeight: number,
        radius: number = this.ENTITY_RADIUS
    ): boolean {
        if (x - radius < 0 || x + radius >= roomWidth ||
            y - radius < 0 || y + radius >= roomHeight) return false;

        for (const ob of obstacles) {
            const left = ob.x - ob.width / 2 - radius;
            const right = ob.x + ob.width / 2 + radius;
            const top = ob.y - ob.height / 2 - radius;
            const bottom = ob.y + ob.height / 2 + radius;
            if (x >= left && x < right && y >= top && y < bottom) {
                return false;
            }
        }
        return true;
    }

    public static lineIntersectsBoxWithoutBorder(
        x1: number, y1: number,
        x2: number, y2: number,
        ob: Obstacle
    ): boolean {
        const left = ob.x - ob.width;
        const right = ob.x + ob.width;
        const top = ob.y - ob.height;
        const bottom = ob.y + ob.height;

        let tmin = 0, tmax = 1;
        const dx = x2 - x1;
        const dy = y2 - y1;

        const p = [-dx, dx, -dy, dy];
        const q = [x1 - left, right - x1, y1 - top, bottom - y1];

        for (let i = 0; i < 4; i++) {
            if (p[i] === 0) {
                if (q[i] < 0) return false;
            } else {
                const t = q[i] / p[i];
                if (p[i] < 0) {
                    tmin = Math.max(tmin, t);
                } else {
                    tmax = Math.min(tmax, t);
                }
                if (tmin > tmax) return false;
            }
        }
        return true;
    }

    public static lineIntersectsBox(
        x1: number, y1: number,
        x2: number, y2: number,
        ob: Obstacle,
        radius: number
    ): boolean {
        const left = ob.x - ob.width - radius / 4;
        const right = ob.x + ob.width + radius / 4;
        const top = ob.y - ob.height - radius / 4;
        const bottom = ob.y + ob.height + radius / 4;

        let tmin = 0, tmax = 1;
        const dx = x2 - x1;
        const dy = y2 - y1;

        const p = [-dx, dx, -dy, dy];
        const q = [x1 - left, right - x1, y1 - top, bottom - y1];

        for (let i = 0; i < 4; i++) {
            if (p[i] === 0) {
                if (q[i] < 0) return false;
            } else {
                const t = q[i] / p[i];
                if (p[i] < 0) {
                    tmin = Math.max(tmin, t);
                } else {
                    tmax = Math.min(tmax, t);
                }
                if (tmin > tmax) return false;
            }
        }
        return true;
    }

    public static hasClearPathToTarget(
        x1: number, y1: number,
        x2: number, y2: number,
        obstacles: readonly Obstacle[],
        roomWidth: number, roomHeight: number,
        radius: number
    ): boolean {
        if (x1 - radius < 0 || x1 + radius > roomWidth ||
            y1 - radius < 0 || y1 + radius > roomHeight) return false;
        if (x2 - radius < 0 || x2 + radius > roomWidth ||
            y2 - radius < 0 || y2 + radius > roomHeight) return false;

        for (const ob of obstacles) {
            const inflated: Obstacle = { 
                ...ob,
                width: ob.width,
                height: ob.height,
                getBounds: ob.getBounds
            };
            if (radius !== 0)
                if (this.lineIntersectsBox(x1, y1, x2, y2, inflated, radius)) return false;
            else if(this.lineIntersectsBoxWithoutBorder(x1, y1, x2, y2, inflated)) return false;
        }
        return true;
    }

    public static findPath(
        fromX: number, fromY: number,
        toX: number, toY: number,
        obstacles: Obstacle[],
        roomWidth: number, roomHeight: number,
        cellSize: number = GAME_CONFIG.CELL_SIZE,
        radius: number = this.ENTITY_RADIUS
    ): Position[] {
        if (this.hasClearPathToTarget(
            fromX,
            fromY, 
            toX, 
            toY, 
            obstacles, 
            roomWidth, 
            roomHeight, 
            radius
        )) return [{ x: toX, y: toY }];
        
        const cols = Math.ceil(roomWidth / cellSize);
        const rows = Math.ceil(roomHeight / cellSize);
        const sx = Math.floor(fromX / cellSize), sy = Math.floor(fromY / cellSize);
        const gx = Math.floor(toX / cellSize), gy = Math.floor(toY / cellSize);
        if (sx === gx && sy === gy) return [];

        const cellWalkable = (cx: number, cy: number) => {
            if (Math.abs(cx - gx) <= 1 && Math.abs(cy - gy) <= 1) {
                const px = cx * cellSize + cellSize / 2;
                const py = cy * cellSize + cellSize / 2;
                return this.isWalkable(px, py, obstacles, roomWidth, roomHeight, 0);
            }
            return this.isWalkable(
                cx * cellSize + cellSize / 2,
                cy * cellSize + cellSize / 2, 
                obstacles, 
                roomWidth, 
                roomHeight, 
                radius
            );
        }
        const key = (x: number, y: number) => y * cols + x;

        const visited = new Set<number>([key(sx, sy)]);
        const cameFrom = new Map<number, number>();
        const queue: Array<{ x: number; y: number }> = [{ x: sx, y: sy }];
        const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        let found = false;

        while (queue.length > 0) {
            const cur = queue.shift()!;
            if (cur.x === gx && cur.y === gy) { found = true; break; }
            for (const [ddx, ddy] of dirs) {
                const nx = cur.x + ddx, ny = cur.y + ddy;
                if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
                if (!cellWalkable(nx, ny)) continue;
                const k = key(nx, ny);
                if (visited.has(k)) continue;
                visited.add(k);
                cameFrom.set(k, key(cur.x, cur.y));
                queue.push({ x: nx, y: ny });
            }
        }
        if (!found) return [];

        const cells: Array<{ x: number; y: number }> = [];
        let cur = key(gx, gy);
        const startKey = key(sx, sy);
        while (cur !== startKey) {
            cells.push({ x: cur % cols, y: Math.floor(cur / cols) });
            const prev = cameFrom.get(cur);
            if (prev === undefined) return [];
            cur = prev;
        }
        cells.reverse();

        return cells.map(c => ({ x: c.x * cellSize + cellSize / 2, y: c.y * cellSize + cellSize / 2 }));
    }
}