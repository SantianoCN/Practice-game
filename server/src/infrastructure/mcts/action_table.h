#include <iostream>
#include <array>
#include "action_types.h"
#include "game_state.h"
#include "room_map.h"
#include "action_module.h"

using ActionCallback = void(*)(GameState&, const RoomMap&, bool npc_turn, int player_idx);

class ActionTable {
private:
    std::array<ActionCallback, static_cast<size_t>(ActionType::COUNT)> action_table;
public:
    ActionTable() {
        action_table[static_cast<size_t>(ActionType::MoveUp)] = &move_up;
        action_table[static_cast<size_t>(ActionType::MoveDown)] = &move_down;
        action_table[static_cast<size_t>(ActionType::MoveLeft)] = &move_left;
        action_table[static_cast<size_t>(ActionType::MoveRight)] = &move_right;
        action_table[static_cast<size_t>(ActionType::Wait)] = &wait;
        action_table[static_cast<size_t>(ActionType::Approach)] = &approach;
        action_table[static_cast<size_t>(ActionType::Retreat)] = &retreat;
        action_table[static_cast<size_t>(ActionType::StrafeLeft)] = &strafe_left;
        action_table[static_cast<size_t>(ActionType::StrafeRight)] = &strafe_right;
        action_table[static_cast<size_t>(ActionType::Attack)] = &attack;
    }
    ActionCallback get_action(ActionType action);
};

inline ActionCallback ActionTable::get_action(ActionType action) {
    return action_table[static_cast<size_t>(action)];
}