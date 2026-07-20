import { RoomType } from '@game/shared';

export interface ObstacleTemplate {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    isDestroyable?: boolean;
    obj: string
}

export interface ChestTemplate {
    gridX: number;
    gridY: number;
    items: string[];
}

export interface RoomTemplate {
    id: string;
    name: string;
    type: RoomType;
    obstacles: ObstacleTemplate[];
    chests: ChestTemplate[];
}

export const ROOM_TEMPLATES: RoomTemplate[] = [
    {
        id: "layout_1",
        name: "комната с двумя стенами",
        type: "Normal",
        obstacles: [
            { startX: 15, startY: 10, endX: 15, endY: 20, obj: 'stone_wall' },
            { startX: 25, startY: 10, endX: 25, endY: 20, obj: 'stone_wall' }  
        ],
        chests: [
            { gridX: 18, gridY: 12, items: ["weapon", "weapon"] },
            { gridX: 22, gridY: 15, items: ["potion"] }
        ]
    }, 
    {
        id: "layout_2",
        name: "комната в комнате",
        type: "Boss",
        obstacles: [
            { startX: 10, startY: 10, endX: 10, endY: 20, obj: 'chair' },
            { startX: 30, startY: 10, endX: 30, endY: 20, obj: 'chair' },
            { startX: 10, startY: 10, endX: 15, endY: 10, obj: 'chair' },
            { startX: 25, startY: 10, endX: 30, endY: 10, obj: 'chair' },
            { startX: 10, startY: 20, endX: 15, endY: 20, obj: 'chair' },
            { startX: 25, startY: 20, endX: 30, endY: 20, obj: 'chair' }
        ],
        chests: [
            { gridX: 20, gridY: 12, items: ["gold", "mana"] },
            { gridX: 20, gridY: 18, items: ["weapon", "gold"] }
        ]
    },
    {
        id: "layout_3",
        name: "колонны по углам",
        type: "Normal",
        obstacles: [
            { startX: 12, startY: 12, endX: 14, endY: 14, obj: 'chair' },
            { startX: 26, startY: 12, endX: 28, endY: 14, obj: 'chair' },
            { startX: 12, startY: 16, endX: 14, endY: 18, obj: 'chair' },
            { startX: 26, startY: 16, endX: 28, endY: 18, obj: 'chair' }
        ],
        chests: [
            { gridX: 20, gridY: 15, items: ["gold", "weapon"] }
        ]
    },
    {
        id: "layout_4",
        name: "центральный крест",
        type: "Normal",
        obstacles: [
            { startX: 12, startY: 15, endX: 28, endY: 15, obj: 'chair' },
            { startX: 20, startY: 10, endX: 20, endY: 20, obj: 'chair' }
        ],
        chests: [
            { gridX: 16, gridY: 13, items: ["weapon"] },
            { gridX: 24, gridY: 17, items: ["gold"] }
        ]
    },
    {
        id: "layout_5",
        name: "комната с платформами",
        type: "Normal",
        obstacles: [
            { startX: 12, startY: 12, endX: 12, endY: 18, obj: 'chair' },
            { startX: 26, startY: 12, endX: 26, endY: 18, obj: 'chair' },
            { startX: 16, startY: 12, endX: 24, endY: 13, obj: 'chair' },
            // { startX: 16, startY: 17, endX: 24, endY: 18, obj: 'chair' }
        ],
        chests: [
            { gridX: 20, gridY: 15, items: ["weapon", "gold"] }
        ]
    }
];