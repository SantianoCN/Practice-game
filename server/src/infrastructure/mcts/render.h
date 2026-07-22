#pragma once
#include <iostream>
#include <iomanip>
#include <string>
#include <vector>
#include <algorithm>
#include "game_state.h"
#include "room_map.h"

// ==================== ѕсевдографика карты ====================
// cell_size Ч сколько игровых юнитов приходитс€ на один символ сетки.
// ѕри карте 20x15 и cell_size=1 получаем сетку 20x15 символов Ч читаемо.
inline void print_map(const GameState& state, const RoomMap& room, int cell_size = 1) {
    int cols = room.width / cell_size;
    int rows = room.height / cell_size;
    std::vector<std::string> grid(rows, std::string(cols, '.'));

    auto put = [&](int x, int y, char c) {
        int gx = x / cell_size, gy = y / cell_size;
        if (gx >= 0 && gx < cols && gy >= 0 && gy < rows) grid[gy][gx] = c;
        };

    for (const Obstacle& ob : room.obstacles) {
        int x0 = ob.x / cell_size, x1 = (ob.x + ob.width) / cell_size;
        int y0 = ob.y / cell_size, y1 = (ob.y + ob.height) / cell_size;
        for (int y = max(0, 0); y < min(y1, rows); ++y)
            for (int x = max(x0, 0); x < min(x1, cols); ++x)
                grid[y][x] = '#';
    }

    for (const Player& p : state.players) {
        if (p.hp > 0) put(p.x, p.y, 'P');
    }
    if (state.npc_hp > 0) put(state.npc_x, state.npc_y, '@');

    std::cout << "+" << std::string(cols, '-') << "+\n";
    for (auto& row : grid) std::cout << "|" << row << "|\n";
    std::cout << "+" << std::string(cols, '-') << "+\n";
    std::cout << "Ћегенда: @ = NPC, P = игрок, # = преп€тствие, . = пусто\n\n";
}

// ==================== “аблица параметров симул€ции ====================
struct SimConfig {
    int map_width, map_height;
    int move_step_size;
    int max_rollout_depth;
    int mcts_iterations;
    double c_value;
    int npc_hp, npc_damage, npc_range;
    int player_hp, player_damage, player_range;
};

inline void print_params(const SimConfig& cfg) {
    auto row = [](const std::string& name, auto value) {
        std::cout << std::left << std::setw(28) << name << value << "\n";
        };
    std::cout << "==================== ѕј–јћ≈“–џ —»ћ”Ћя÷»» ====================\n";
    row("–азмер карты", std::to_string(cfg.map_width) + " x " + std::to_string(cfg.map_height));
    row("Ўаг движени€ за ход", cfg.move_step_size);
    row("√лубина rollout", cfg.max_rollout_depth);
    row("»тераций MCTS", cfg.mcts_iterations);
    row("C (UCT)", cfg.c_value);
    std::cout << "---------------------------------------------------------------\n";
    row("NPC HP", cfg.npc_hp);
    row("NPC урон", cfg.npc_damage);
    row("NPC дальность атаки", cfg.npc_range);
    std::cout << "---------------------------------------------------------------\n";
    row("»грок HP", cfg.player_hp);
    row("»грок урон", cfg.player_damage);
    row("»грок дальность атаки", cfg.player_range);
    std::cout << "===============================================================\n\n";
}