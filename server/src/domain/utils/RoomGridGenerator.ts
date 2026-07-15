import { Chest } from "../entities/Chest";
import { Obstacle } from "../entities/Obstacle";
import { IdGenerator } from "./IDGenerator";
import { rooms } from '../rooms/rooms'
import { RoomState } from "../../../../shared/gameTypes";
import { LootableItem } from "../entities/LootableItem";
import Weapon from "../items/Weapon";
import { ICE_STAFF, SLASH, SWORD } from "../../config/weaponPresets";


export class RoomGridGenerator {
    public  static readonly CELL_SIZE = 20;
    private static readonly MAX_OBSTACLE_PLACE = 4;
    private static readonly MIN_OBSTACLE_COUNT = 1;
    private static readonly MAX_OBSTACLE_COUNT = 4;
    private static readonly MIN_GAP = 1;

    public static generatePersistence(roomState: RoomState): {
        obstacles: Obstacle[],
        chests: Chest[]
    } {
        const availableRooms = rooms.filter(
            room => room.type === roomState.type
        );

        if (availableRooms.length > 0) {
            const roomIdx = Math.floor(Math.random() * availableRooms.length);
            const room = availableRooms[roomIdx];
            
            const chests: Chest[] = [];
            for (const chest of room.chests) {
                const lootableItems: LootableItem[] = [];
                for (const item of chest.items) {
                    switch(item) {
                        case "weapon": {
                            const availableWeapons = [ICE_STAFF, SWORD];
                            const weaponIdx = Math.floor(
                                Math.random() 
                                * availableWeapons.length
                            );
                            const weapon = new Weapon(
                                IdGenerator.generateId('weapon-loot'),
                                'name',
                                availableWeapons[weaponIdx]
                            );
                            lootableItems.push({ 
                                type: 'weapon',
                                weapon: availableWeapons[weaponIdx]
                            });
                            break;
                        }
                        case "gold": {
                            lootableItems.push({ 
                                type: 'gold',
                                gold: Math.floor(Math.random() * 100)
                            });
                            break;
                        }
                        case "mana": {
                            lootableItems.push({ 
                                type: 'gold',
                                gold: Math.floor(Math.random() * 100)
                            });
                            break;
                        }
                    }
                }
                chests.push(new Chest(
                    IdGenerator.generateId('chest'),
                    chest.gridX,
                    chest.gridY,
                    lootableItems
                ));
            }
            
            return {
                obstacles: room.obstacles.map(ob => new Obstacle(
                    IdGenerator.generateId('obstacle'),
                    ob.startX,
                    ob.startY,
                    ob.endX,
                    ob.endY,
                    ob.isDestroyable
                )),
                chests: chests
            }
        } else 
            return { 
                obstacles: [],
                 chests: [] 
            }
    }


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

        const chestCount = Math.floor(Math.random() * 2);

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
                chest.gridX, 
                chest.gridY, 
                occupied
            )) {
                this.pushOccupied(
                    chest.gridX,
                    chest.gridY,
                    chest.gridX,
                    chest.gridY,
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
        let row = Math.floor(Math.random() * gridRows) + 1;
        let col = Math.floor(Math.random() * gridCols) + 1;

        if (row < 4) row += row;
        if (row > gridRows - 4) row -= 4;

        if (col < 4) col += col;
        if (col > gridCols - 4) col -= 4;

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

        let startX = Math.floor(Math.random() * (gridCols - width));
        let startY = Math.floor(Math.random() * (gridRows - height));

        if (startX < 4) startX = 4;
        if (startY < 4) startY = 4;
        
        let endX = startX + width + 1;
        let endY = startY + height + 1;
        
        if (endX > gridCols - 4) endX = gridRows - 4;
        if (endY > gridRows - 4) endY = gridRows - 4;

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