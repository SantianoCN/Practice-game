#pragma once
#include <vector>
#include "player.h"

struct GameState {
    static constexpr int MAX_PLAYERS_COUNT = 4;
    Player players[MAX_PLAYERS_COUNT];
    int players_count = 0;
    int npc_hp;
    int npc_damage;
    int npc_range;
    int npc_speed;
    int npc_x;
    int npc_y;
    int npc_vx;
    int npc_vy;
};