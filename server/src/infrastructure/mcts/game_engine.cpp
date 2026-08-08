#include <random>
#include <limits>
#include "game_engine.h"
#include <algorithm>

void GameEngine::apply_action(GameState& state, ActionType action, bool npc_turn, int player_idx) {
    ActionCallback ac = action_table.get_action(action);
    if (ac != nullptr) {
        ac(state, map, npc_turn, player_idx);
    }
}

bool GameEngine::is_terminal(const GameState& state) {
    if (state.npc_hp <= 0) return true;
    for (int i = 0; i < state.players_count; i++) {
        if (state.players[i].hp > 0)
            return false;
    }
    return true;
}

void GameEngine::set_available_actions() {
    available_actions = action_table.get_available_actions();
}

std::vector<ActionType>& GameEngine::get_available_actions() {
    return available_actions;
}

double GameEngine::heuristic_eval(const GameState& state) const {
    double reward = 0.0;
    double players_hp_sum = 0;
    int min_distance = std::numeric_limits<int>::max();
    bool player_alive = false;

    for (int i = 0; i < state.players_count; i++) {
        if (state.players[i].hp <= 0) continue;
        player_alive = true;
        players_hp_sum += state.players[i].hp;

        int dx = state.players[i].x - state.npc_x;
        int dy = state.players[i].y - state.npc_y;
        int distance = (int)sqrt(dx * dx + dy * dy);
        if (distance < min_distance) min_distance = distance;
    }

    double npc_hp_reward = 0;
    npc_hp_reward = std::clamp((double)state.npc_hp / state.npc_max_hp, 0.0, 1.0);
    reward += npc_hp_reward;

    if (min_distance != std::numeric_limits<int>::max()) {
        double ideal_min = state.npc_range * 0.8;
        double ideal_max = state.npc_range * 1.0;
 
        if (min_distance >= ideal_min && min_distance <= ideal_max) {
            reward += 0.15;
        } else if (min_distance < ideal_min) {
            double deviation = (ideal_min - min_distance) / ideal_min;
            reward -= deviation * 0.2;
        } else {
            double deviation = (min_distance - ideal_max) / ideal_max;
            reward -= deviation * 0.3;
        }
 
        const double LOW_HP_THRESHOLD = 0.3;
        if (npc_hp_reward < LOW_HP_THRESHOLD) {
            double danger = (LOW_HP_THRESHOLD - npc_hp_reward) / LOW_HP_THRESHOLD;
            double closeness = std::clamp(1.0 - (double)min_distance / std::max(1, state.npc_range), 0.0, 1.0);
            reward -= danger * closeness * 0.5;
        }
    }

    return reward;
}

double GameEngine::rollout(GameState& state) {
    static thread_local std::mt19937 rng{ std::random_device{}() };
    bool npc_turn = true;
    int depth = 0;

    while (!is_terminal(state) && depth < MAX_ROLLOUT_DEPTH) {
        auto available = npc_turn ? get_available_actions() : get_player_actions();

        if (!available.empty()) {  
            std::uniform_int_distribution<size_t> dist(0, available.size() - 1);
            if (npc_turn) {
                apply_action(state, available[dist(rng)], npc_turn);
            }
            else {
                for (int i = 0; i < state.players_count; i++) {
                    apply_action(state, available[dist(rng)], npc_turn, i);
                }
            }
        }
        npc_turn = !npc_turn;
        depth++;
    }

    if (is_terminal(state)) return (state.npc_hp > 0) ? WIN_REWARD + state.npc_hp * 0.01 : LOSE_REWARD;
    return heuristic_eval(state);
}