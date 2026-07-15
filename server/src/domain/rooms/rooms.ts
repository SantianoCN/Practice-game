export const rooms = [
    {
        "id": "layout_1",
        "name": "комната с двумя стенами",
        "type": "Normal",
        "obstacles": [
            // Левая стена
            {
                "startX": 15,
                "startY": 10,
                "endX": 15,
                "endY": 20,
                "isDestroyable": false
            },
            // Правая стена
            {
                "startX": 25,
                "startY": 10,
                "endX": 25,
                "endY": 20,
                "isDestroyable": false
            }
        ],
        "chests": [
            {
                "gridX": 18,
                "gridY": 12,
                "items": ["sword", "shield"]
            },
            {
                "gridX": 22,
                "gridY": 15,
                "items": ["potion"]
            }
        ]
    }, 
    {
        "id": "layout_2",
        "name": "комната в комнате (квадрат с входом)",
        "type": "Boss",
        "obstacles": [
            // Левая стена
            {
                "startX": 10,
                "startY": 10,
                "endX": 10,
                "endY": 20,
                "isDestroyable": false
            },
            // Правая стена
            {
                "startX": 30,
                "startY": 10,
                "endX": 30,
                "endY": 20,
                "isDestroyable": false
            },
            // Верхняя стена (с проходом посередине)
            {
                "startX": 10,
                "startY": 10,
                "endX": 15,
                "endY": 10,
                "isDestroyable": false
            },
            {
                "startX": 25,
                "startY": 10,
                "endX": 30,
                "endY": 10,
                "isDestroyable": false
            },
            // Нижняя стена (с проходом посередине)
            {
                "startX": 10,
                "startY": 20,
                "endX": 15,
                "endY": 20,
                "isDestroyable": false
            },
            {
                "startX": 25,
                "startY": 20,
                "endX": 30,
                "endY": 20,
                "isDestroyable": false
            }
        ],
        "chests": [
            {
                "gridX": 20,
                "gridY": 12,
                "items": ["gold", "mana"]
            },
            {
                "gridX": 20,
                "gridY": 18,
                "items": ["weapon", "gold"]
            },
            {
                "gridX": 13,
                "gridY": 15,
                "items": ["potion"]
            },
            {
                "gridX": 27,
                "gridY": 15,
                "items": ["weapon"]
            }
        ]
    },
    {
        "id": "layout_3",
        "name": "колонны по углам",
        "type": "Normal",
        "obstacles": [
            // Колонна в левом верхнем углу
            {
                "startX": 12,
                "startY": 12,
                "endX": 14,
                "endY": 14,
                "isDestroyable": false
            },
            // Колонна в правом верхнем углу
            {
                "startX": 26,
                "startY": 12,
                "endX": 28,
                "endY": 14,
                "isDestroyable": false
            },
            // Колонна в левом нижнем углу
            {
                "startX": 12,
                "startY": 16,
                "endX": 14,
                "endY": 18,
                "isDestroyable": false
            },
            // Колонна в правом нижнем углу
            {
                "startX": 26,
                "startY": 16,
                "endX": 28,
                "endY": 18,
                "isDestroyable": false
            }
        ],
        "chests": [
            {
                "gridX": 20,
                "gridY": 15,
                "items": ["gold", "weapon"]
            },
            {
                "gridX": 18,
                "gridY": 12,
                "items": ["potion"]
            }
        ]
    },
    {
        "id": "layout_4",
        "name": "центральный крест",
        "type": "Normal",
        "obstacles": [
            // Горизонтальная стена
            {
                "startX": 12,
                "startY": 15,
                "endX": 28,
                "endY": 15,
                "isDestroyable": false
            },
            // Вертикальная стена
            {
                "startX": 20,
                "startY": 10,
                "endX": 20,
                "endY": 20,
                "isDestroyable": false
            }
        ],
        "chests": [
            {
                "gridX": 16,
                "gridY": 13,
                "items": ["sword"]
            },
            {
                "gridX": 24,
                "gridY": 13,
                "items": ["shield"]
            },
            {
                "gridX": 16,
                "gridY": 17,
                "items": ["potion"]
            },
            {
                "gridX": 24,
                "gridY": 17,
                "items": ["gold", "mana"]
            }
        ]
    },
    {
        "id": "layout_5",
        "name": "комната с платформами",
        "type": "Normal",
        "obstacles": [
            // Платформа слева
            {
                "startX": 12,
                "startY": 12,
                "endX": 12,
                "endY": 18,
                "isDestroyable": false
            },
            // Платформа справа
            {
                "startX": 26,
                "startY": 12,
                "endX": 26,
                "endY": 18,
                "isDestroyable": false
            },
            // Платформа сверху
            {
                "startX": 16,
                "startY": 12,
                "endX": 24,
                "endY": 13,
                "isDestroyable": false
            },
            // Платформа снизу
            {
                "startX": 16,
                "startY": 17,
                "endX": 24,
                "endY": 18,
                "isDestroyable": false
            }
        ],
        "chests": [
            {
                "gridX": 20,
                "gridY": 15,
                "items": ["weapon", "gold"]
            },
            {
                "gridX": 13,
                "gridY": 15,
                "items": ["potion"]
            },
            {
                "gridX": 27,
                "gridY": 15,
                "items": ["mana"]
            }
        ]
    },
    {
        "id": "layout_6",
        "name": "комната с перегородкой",
        "type": "Normal",
        "obstacles": [
            // Вертикальная перегородка посередине
            {
                "startX": 20,
                "startY": 12,
                "endX": 20,
                "endY": 18,
                "isDestroyable": false
            },
            // Горизонтальная перегородка сверху
            {
                "startX": 14,
                "startY": 14,
                "endX": 18,
                "endY": 14,
                "isDestroyable": false
            },
            // Горизонтальная перегородка снизу
            {
                "startX": 22,
                "startY": 16,
                "endX": 26,
                "endY": 16,
                "isDestroyable": false
            }
        ],
        "chests": [
            {
                "gridX": 16,
                "gridY": 12,
                "items": ["sword"]
            },
            {
                "gridX": 24,
                "gridY": 14,
                "items": ["potion", "mana"]
            },
            {
                "gridX": 16,
                "gridY": 18,
                "items": ["gold"]
            },
            {
                "gridX": 24,
                "gridY": 18,
                "items": ["shield"]
            }
        ]
    },
    {
        "id": "layout_7",
        "name": "круглая комната (восьмиугольник)",
        "type": "Boss",
        "obstacles": [
            // Верхний ряд
            {
                "startX": 14,
                "startY": 10,
                "endX": 16,
                "endY": 10,
                "isDestroyable": false
            },
            {
                "startX": 24,
                "startY": 10,
                "endX": 26,
                "endY": 10,
                "isDestroyable": false
            },
            // Второй ряд
            {
                "startX": 12,
                "startY": 11,
                "endX": 13,
                "endY": 11,
                "isDestroyable": false
            },
            {
                "startX": 27,
                "startY": 11,
                "endX": 28,
                "endY": 11,
                "isDestroyable": false
            },
            // Третий ряд
            {
                "startX": 10,
                "startY": 12,
                "endX": 11,
                "endY": 18,
                "isDestroyable": false
            },
            {
                "startX": 29,
                "startY": 12,
                "endX": 30,
                "endY": 18,
                "isDestroyable": false
            },
            // Четвертый ряд
            {
                "startX": 12,
                "startY": 19,
                "endX": 13,
                "endY": 19,
                "isDestroyable": false
            },
            {
                "startX": 27,
                "startY": 19,
                "endX": 28,
                "endY": 19,
                "isDestroyable": false
            },
            // Пятый ряд
            {
                "startX": 14,
                "startY": 20,
                "endX": 16,
                "endY": 20,
                "isDestroyable": false
            },
            {
                "startX": 24,
                "startY": 20,
                "endX": 26,
                "endY": 20,
                "isDestroyable": false
            }
        ],
        "chests": [
            {
                "gridX": 20,
                "gridY": 15,
                "items": ["weapon", "gold", "mana"]
            },
            {
                "gridX": 14,
                "gridY": 15,
                "items": ["potion"]
            },
            {
                "gridX": 26,
                "gridY": 15,
                "items": ["shield"]
            }
        ]
    }
];