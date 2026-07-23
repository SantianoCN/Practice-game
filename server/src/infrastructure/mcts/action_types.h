#pragma once

enum ActionType {
    MoveUp,     // 0
    MoveDown,   // 1
    MoveLeft,   // 2
    MoveRight,  // 3
    Wait,       // 4
    Approach,   // 5
    Retreat,    // 6
    StrafeLeft, // 7
    StrafeRight,// 8
    Attack,     // 9
    None,       // 10
    COUNT       // 11
};

inline const char* action_names[] = {
			"Вверх",        // MoveUp
			"Вниз",         // MoveDown
			"Влево",        // MoveLeft
			"Вправо",       // MoveRight
			"Ждать",        // Wait
			"Сближение",    // Approach
			"Отступление",  // Retreat
			"Стрейф влево", // StrafeLeft
			"Стрейф вправо",// StrafeRight
			"Атака",        // Attack
			"Нет действия"  // None
};