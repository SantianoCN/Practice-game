#pragma once
#include <iostream>
#include <array>
#include "action_types.h"
#include "game_state.h"
#include "room_map.h"
#include "action_module.h"

using ActionCallback = void(*)(GameState&, const RoomMap& map, bool npc_turn,  int player_idx);

class ActionTable {
private:
    std::array<ActionCallback, static_cast<size_t>(ActionType::COUNT)> action_table;
public:
    ActionTable() {
        action_table[static_cast<size_t>(ActionType::Engage)] = &engage;
        //action_table[static_cast<size_t>(ActionType::Flank)] = &flank;
        action_table[static_cast<size_t>(ActionType::Kite)] = &kite;
        action_table[static_cast<size_t>(ActionType::Retreat)] = &retreat;
        action_table[static_cast<size_t>(ActionType::Wait)] = &wait;
        action_table[static_cast<size_t>(ActionType::PlayerAttack)] = &player_attack;
        action_table[static_cast<size_t>(ActionType::PlayerMoveAway)] = &player_move_away;
        action_table[static_cast<size_t>(ActionType::PlayerMoveCloser)] = &player_move_closer;
    }
    ActionCallback get_action(ActionType action);
    std::vector<ActionType> get_available_actions();
    std::vector<ActionType> get_player_actions();
};

inline ActionCallback ActionTable::get_action(ActionType action) {
    return action_table[static_cast<size_t>(action)];
}

inline std::vector<ActionType> get_player_actions() {
    std::vector<ActionType> actions;
    for (int i = static_cast<int>(ActionType::Wait);
        i <= static_cast<int>(ActionType::PlayerMoveCloser); i++) {
        actions.push_back(static_cast<ActionType>(i));
    }
    return actions;
}

inline std::vector<ActionType> ActionTable::get_available_actions() {
    std::vector<ActionType> actions;
    for (int i = static_cast<int>(ActionType::Engage);
        i <= static_cast<int>(ActionType::Wait); i++) {
        actions.push_back(static_cast<ActionType>(i));
    }
    return actions;
}