#pragma once

// “актические многокомпанентные действи€
enum ActionType {
    Engage, // сближение и атака при LOS
    Kite,   // держать дистанцию и стрел€ть при LOS
    Flank,  // обойти/зайти в тыл
    Retreat,// отступить, отойти
    Wait,   // никчего не делать или стрел€ть
    PlayerAttack,   // игрок атакует
    PlayerMoveAway, // игрок отходит
    PlayerMoveCloser,   // игрок приближаетс€
    None,   // нет действи€
    COUNT   // кол-во действий
};

inline const char* action_names[] = {
    "Engage",
    "Kite",
    "Flank",
    "Retreat",
    "Wait",
    "PlayerAttack", 
    "PlayeMoveAway",
    "PlayerMoveCloser",
    "None"
};