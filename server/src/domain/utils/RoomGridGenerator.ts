import { Chest } from "../entities/Chest";
import { Obstacle } from "../entities/Obstacle";
import Weapon from "../items/Weapon";
import { IdGenerator } from "./IDGenerator";


export class RoomGridGenerator {
    public static readonly CELL_SIZE = 20;
    private static readonly MAX_OBSTACLE_PLACE = 4;
    private static readonly MIN_OBSTACLE_COUNT = 1;
    private static readonly MAX_OBSTACLE_COUNT = 4;
    private static readonly MIN_GAP = 1;

    public static populate(
        roomWidth: number,
        roomHeight: number,
        chestsCount: number
    ): {
        chests: Chest[],
        obstacles: Obstacle[]
    } {
        const occupied = new Set<string>();
        const chests: Chest[] = [];
        const obstacles: Obstacle[] = [];

        const gridRows = Math.floor(roomHeight / this.CELL_SIZE);
        const gridCols = Math.floor(roomWidth / this.CELL_SIZE);

        const obstaclesCount = Math.floor(
            Math.random() * (this.MAX_OBSTACLE_COUNT - this.MIN_OBSTACLE_COUNT + 1)
        ) + this.MIN_OBSTACLE_COUNT;

        const chestCount = Math.floor(Math.random() * 1);

        let counter = 0;
        while (counter < obstaclesCount) {
            const obstacle = this.generateRandomObstacle(gridRows, gridCols);
            if (this.isAreaFree(
                obstacle.startGridX,
                obstacle.startGridY,
                obstacle.endGridX,
                obstacle.endGridY,
                occupied
            )) {
                this.pushOccupied(
                    obstacle.startGridX,
                    obstacle.startGridY,
                    obstacle.endGridX,
                    obstacle.endGridY,
                    occupied
                );
                obstacles.push(obstacle);
                counter++;
            }
        }

        counter = 0;
        while (counter < chestCount) {
            const chest = this.generateRandomChest(gridRows, gridCols, chestCount);
            if (this.isAreaFree(
                chest.gridX,
                chest.gridY,
                chest.gridX + this.CELL_SIZE,
                chest.gridY + this.CELL_SIZE,
                occupied
            )) {
                this.pushOccupied(
                    chest.gridX,
                    chest.gridY,
                    chest.gridX + this.CELL_SIZE,
                    chest.gridY + this.CELL_SIZE,
                    occupied
                );
                chests.push(chest);
                counter++;
            }
        }

        console.log(obstacles);
        return { chests, obstacles }
    }

    private static generateRandomChest(
        gridRows: number,
        gridCols: number,
        count: number
    ): Chest {
        const row = Math.floor(Math.random() * gridRows);
        const col = Math.floor(Math.random() * gridCols);

        return new Chest(
            IdGenerator.generateId('chest'),
            col,
            row,
            []
        );
    }

    private static generateRandomObstacle(gridRows: number, gridCols: number): Obstacle {
        const maxObstacleWidth = Math.min(3, Math.floor(gridCols / 2));
        const maxObstacleHeight = this.MAX_OBSTACLE_PLACE;

        const width = Math.floor(Math.random() * maxObstacleWidth) + 1;
        const height = Math.floor(Math.random() * maxObstacleHeight) + 1;

        const startX = Math.floor(Math.random() * (gridCols - width));
        const startY = Math.floor(Math.random() * (gridRows - height));

        const endX = startX + width + 1;
        const endY = startY + height + 1;

        return new Obstacle(
            IdGenerator.generateUUID('obstacle'),
            startX,
            startY,
            endX,
            endY,
            false
        );
    }

    private static isAreaFree(
        startX: number,
        startY: number,
        endX: number,
        endY: number,
        occupied: Set<string>
    ): boolean {
        for (let y = startY - this.MIN_GAP; y < endY + this.MIN_GAP; y++) {
            for (let x = startX - this.MIN_GAP; x < endX + this.MIN_GAP; x++) {
                if (occupied.has(`${x},${y}`))
                    return false;
            }
        }
        return true;
    }

    private static pushOccupied(
        startX: number,
        startY: number,
        endX: number,
        endY: number,
        occupied: Set<string>
    ) {
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                occupied.add(`${x},${y}`);
            }
        }
    }
}