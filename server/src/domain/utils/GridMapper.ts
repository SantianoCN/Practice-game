import { BaseNetworkEntity } from "../../../../shared/gameTypes";


export default class GridMapper {
    
    public static mapObstacleToBaseNetworkEntity (
        id: string,
        startX: number,
        startY: number, 
        endX: number, 
        endY: number, 
        cellSize: number,
        sprite: string
    ): BaseNetworkEntity{
        const width = (endX - startX + 1) * cellSize;
        const height = (endY - startY + 1) * cellSize;
        const x = startX * cellSize + width / 2;
        const y = startY * cellSize + height / 2;
        
        return { id, x, y, width, height, sprite} 
    }

    public static mapChestToBaseNetworkEntity (
        id: string,
        gridX: number,
        gridY: number,
        cellSize: number,
        sprite: string
    ): BaseNetworkEntity {
        const width = cellSize;
        const height = cellSize;
        const x = gridX * cellSize + width / 2;
        const y = gridY * cellSize + height / 2;

        return { id,  x, y, width, height, sprite }
    }
}