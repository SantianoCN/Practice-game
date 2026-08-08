#pragma once


enum ActionType {
    Engage, 
    Kite,   
    Retreat,
    Wait,   
    PlayerAttack,   
    PlayerMoveAway, 
    PlayerMoveCloser,   
    None,   
    COUNT   
};

inline const char* action_names[] = {
    "Engage",
    "Kite",
    "Retreat",
    "Wait",
    "PlayerAttack", 
    "PlayeMoveAway",
    "PlayerMoveCloser",
    "None"
};