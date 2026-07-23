#pragma once
#include "room_map.h"
#include "action_table.h"

class GameEngine {
private:
    ActionTable action_table;
    std::vector<ActionType> available_actions;
    int max_rollout_depth = 100;
    
    static constexpr int MOVE_STEP_SIZE = 10;
    static constexpr int MAX_ROLLOUT_DEPTH = 100;
    static constexpr double WIN_REWARD = 1.0;
    static constexpr int MIN_DISTANCE = 10;

    static constexpr double LOSE_REWARD = -1.0;
    
    void set_available_actions();
    void integrate_movement(GameState& state, bool npc_turn, int player_idx = 0);
    double heuristic_eval(const GameState& state) const;
public:
    RoomMap map;
    int get_move_step_size() const { return MOVE_STEP_SIZE; }
    int get_max_rollout_depth() const { return MAX_ROLLOUT_DEPTH; }
    GameEngine(RoomMap roomMap) {
        map = roomMap;
        set_available_actions();
    }
    bool is_terminal(const GameState& state);
    void apply_action(GameState& state, ActionType action, bool npc_turn, int player_idx = 0);
    double rollout(GameState& state);
    std::vector<ActionType>& get_available_actions();
};