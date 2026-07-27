import { Obstacle } from "../entities/Obstacle";


export default class EnemyPathFinder {

    public static hasLineOfSight(
        x1: number, y1: number,
        x2: number, y2: number,
        obstacles: Obstacle[]
    ): boolean {
        for (const ob of obstacles) {
            if (this.lineIntersectsBox(x1, x2, y1, y2, ob))
                return false;
        }

        return true;
    }

    public static lineIntersectsBox(
        x1: number, y1: number,
        x2: number, y2: number,
        ob: Obstacle
    ): boolean {
        const left = ob.x - ob.width / 2;
        const right = ob.x + ob.width / 2;
        const top = ob.y - ob.height / 2;
        const bottom = ob.y + ob.height / 2;

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
}