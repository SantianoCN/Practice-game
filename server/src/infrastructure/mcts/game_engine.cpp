#include <random>
#include <limits>
#include "game_engine.h"

void GameEngine::apply_action(GameState& state, ActionType action, bool npc_turn, int player_idx) {
    ActionCallback ac = action_table.get_action(action);
    if (ac != nullptr) {
        ac(state, map, npc_turn, player_idx);
    }
    integrate_movement(state, npc_turn, player_idx);
}

void GameEngine::integrate_movement(GameState& state, bool npc_turn, int player_idx) {
    int& x = npc_turn ? state.npc_x : state.players[player_idx].x;
    int& y = npc_turn ? state.npc_y : state.players[player_idx].y;
    int vx = npc_turn ? state.npc_vx : state.players[player_idx].vx;
    int vy = npc_turn ? state.npc_vy : state.players[player_idx].vy;
    if (vx == 0 && vy == 0) return;

    int cx = x, cy = y;
    for (int i = 0; i < MOVE_STEP_SIZE; ++i) {
        int nx = cx + vx, ny = cy + vy;
        if (map.is_wall(nx, ny)) {
            //if (npc_turn) state.npc_hp = 0;   
            return;
        }
        cx = nx; cy = ny;
    }
    x = cx; y = cy;
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
    for (int i = 0; i < static_cast<int>(ActionType::COUNT); ++i) {
        if (i != static_cast<int>(ActionType::None)) {
            available_actions.push_back(static_cast<ActionType>(i));
        }
    }
}

std::vector<ActionType>& GameEngine::get_available_actions() {
    return available_actions;
}

double GameEngine::heuristic_eval(const GameState& state) const {
    double reward = 0.0;
    double players_hp_sum = 0;
    int min_distance = std::numeric_limits<int>::max();
    bool player_alive = false;

    for (const Player& p : state.players) {
        if (p.hp <= 0) continue;
        player_alive = true;
        players_hp_sum += p.hp;

        int dx = p.x - state.npc_x;
        int dy = p.y - state.npc_y;
        int distance = (int)sqrt(dx * dx + dy * dy);
        if (distance < min_distance) min_distance = distance;
    }

    /*if (!player_alive) return 1000.0;
    if (state.npc_hp <= 0) return -1000.0;*/

    double damage = 150.0 - players_hp_sum;
    reward += damage * 0.5;  

    reward += state.npc_hp * 0.2;  

    double ideal_min = state.npc_range * 0.8;
    double ideal_max = state.npc_range * 1.0;

    if (min_distance >= ideal_min && min_distance <= ideal_max) {
        reward += 30.0;
    }
    else if (min_distance < ideal_min) {
        double deviation = (ideal_min - min_distance) / ideal_min;
        reward -= deviation * 40.0;
    }
    else {
        double deviation = (min_distance - ideal_max) / ideal_max;
        reward -= deviation * 60.0;
    }

    if (min_distance <= state.npc_range) {
        reward += 5.0;
    }

    return reward;
}

double GameEngine::rollout(GameState& state) {
    static thread_local std::mt19937 rng{ std::random_device{}() };
    bool npc_turn = true;
    int depth = 0;

    while (!is_terminal(state) && depth < MAX_ROLLOUT_DEPTH) {
        auto& available = get_available_actions();
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

    if (is_terminal(state)) return (state.npc_hp > 0) ? WIN_REWARD : LOSE_REWARD;
    return heuristic_eval(state);
}