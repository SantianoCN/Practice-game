import { RoomType } from '@game/shared';

export interface ObstacleTemplate {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    obj: string;
    isDestroyable?: boolean;
}

export interface ChestTemplate {
    gridX: number;
    gridY: number;
    presetId: string;
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
            { startX: 15, startY: 10, endX: 15, endY: 20, obj: 'stone' },
            { startX: 25, startY: 10, endX: 25, endY: 20, obj: 'stone' }  
        ],
        chests: [
            { gridX: 18, gridY: 12, presetId: "chest_wooden" },
            { gridX: 22, gridY: 15, presetId: "chest_wooden" }
        ]
    }, 
    {
        id: "layout_2",
        name: "комната в комнате",
        type: "Boss",
        obstacles: [
            { startX: 10, startY: 10, endX: 10, endY: 20, obj: 'stone' },
            { startX: 30, startY: 10, endX: 30, endY: 20, obj: 'stone' },
            { startX: 10, startY: 10, endX: 15, endY: 10, obj: 'stone' },
            { startX: 25, startY: 10, endX: 30, endY: 10, obj: 'stone' },
            { startX: 10, startY: 20, endX: 15, endY: 20, obj: 'stone' },
            { startX: 25, startY: 20, endX: 30, endY: 20, obj: 'stone' }
        ],
        chests: [
            { gridX: 20, gridY: 12, presetId: "chest_gold_boss" },
            { gridX: 20, gridY: 18, presetId: "chest_wooden" }
        ]
    },
    {
        id: "layout_3",
        name: "колонны по углам",
        type: "Normal",
        obstacles: [
            { startX: 12, startY: 12, endX: 14, endY: 14, obj: 'stone' },
            { startX: 26, startY: 12, endX: 28, endY: 14, obj: 'stone' },
            { startX: 12, startY: 16, endX: 14, endY: 18, obj: 'stone' },
            { startX: 26, startY: 16, endX: 28, endY: 18, obj: 'stone' }
        ],
        chests: [
            { gridX: 20, gridY: 15, presetId: "chest_wooden" }
        ]
    },
    {
        id: "layout_4",
        name: "центральный крест",
        type: "Normal",
        obstacles: [
            { startX: 12, startY: 15, endX: 28, endY: 15, obj: 'stone' },
            { startX: 20, startY: 10, endX: 20, endY: 20, obj: 'stone' }
        ],
        chests: [
            { gridX: 16, gridY: 13, presetId: "chest_wooden" },
            { gridX: 24, gridY: 17, presetId: "chest_wooden" }
        ]
    },
    {
        id: "layout_5",
        name: "комната с платформами",
        type: "Normal",
        obstacles: [
            { startX: 12, startY: 12, endX: 12, endY: 18, obj: 'stone' },
            { startX: 28, startY: 12, endX: 28, endY: 18, obj: 'stone' },
            { startX: 16, startY: 12, endX: 24, endY: 13, obj: 'stone' },
            { startX: 16, startY: 17, endX: 24, endY: 18, obj: 'stone' }
        ],
        chests: [
            { gridX: 20, gridY: 15, presetId: "chest_wooden" }
        ]
    },
    {
        id: "layout_6",
        name: "Центральный крест",
        type: "Normal",
        obstacles: [
            { startX: 18, startY: 8, endX: 21, endY: 11, obj: 'stone' },
            { startX: 18, startY: 19, endX: 21, endY: 22, obj: 'stone' },
            { startX: 8, startY: 14, endX: 13, endY: 15, obj: 'stone' },
            { startX: 26, startY: 14, endX: 31, endY: 15, obj: 'stone' }
        ],
        chests: [
            { gridX: 19, gridY: 14, presetId: "chest_wooden" }
        ]
    },
    {
        id: "layout_7",
        name: "Коридоры и укрытия",
        type: "Normal",
        obstacles: [
            { startX: 6, startY: 6, endX: 10, endY: 10, obj: 'stone' },
            { startX: 29, startY: 6, endX: 33, endY: 10, obj: 'stone' },
            { startX: 6, startY: 19, endX: 10, endY: 23, obj: 'stone' },
            { startX: 29, startY: 19, endX: 33, endY: 23, obj: 'stone' },
            { startX: 16, startY: 14, endX: 17, endY: 16, obj: 'stone' },
            { startX: 22, startY: 14, endX: 23, endY: 16, obj: 'stone' }
        ],
        chests: [
            { gridX: 8, gridY: 8, presetId: "chest_wooden" },
            { gridX: 31, gridY: 21, presetId: "chest_wooden" }
        ]
    },
    {
        id: "layout_8",
        name: "Лабиринт у входов",
        type: "Normal",
        obstacles: [
            { startX: 5, startY: 8, endX: 25, endY: 9, obj: 'stone' },
            { startX: 14, startY: 15, endX: 34, endY: 16, obj: 'stone' },
            { startX: 5, startY: 21, endX: 25, endY: 22, obj: 'stone' }
        ],
        chests: [
            { gridX: 32, gridY: 7, presetId: "chest_wooden" },
            { gridX: 7, gridY: 24, presetId: "chest_wooden" }
        ]
    },
    {
        id: "layout_9",
        name: "Зал босса",
        type: "Boss",
        obstacles: [
            { startX: 18, startY: 5, endX: 21, endY: 7, obj: 'stone' },
            { startX: 17, startY: 7, endX: 22, endY: 8, obj: 'stone' },
            { startX: 8, startY: 10, endX: 9, endY: 11, obj: 'stone' },
            { startX: 30, startY: 10, endX: 31, endY: 11, obj: 'stone' },
            { startX: 8, startY: 20, endX: 9, endY: 21, obj: 'stone' },
            { startX: 30, startY: 20, endX: 31, endY: 21, obj: 'stone' }
        ],
        chests: [
            { gridX: 19, gridY: 4, presetId: "chest_gold_boss" }
        ]
    },
    {
        id: "layout_10",
        name: "Арена с центральным рингом",
        type: "Normal",
        obstacles: [
            { startX: 14, startY: 10, endX: 25, endY: 11, obj: 'stone' },
            { startX: 14, startY: 18, endX: 25, endY: 19, obj: 'stone' },
            { startX: 14, startY: 12, endX: 15, endY: 17, obj: 'stone' }
        ],
        chests: [
            { gridX: 19, gridY: 14, presetId: "chest_wooden" }
        ]
    }
];