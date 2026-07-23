#pragma once
#include <climits>
#include <iostream>
#include "game_state.h"
#include "room_map.h"

inline int sign(int v) { return (v > 0) - (v < 0); }

inline const Player* find_closest_player(const GameState& state, int& out_dist_sq) {
    const Player* best = nullptr;
    out_dist_sq = INT_MAX;
    for (int i = 0; i < state.players_count; i++) {
        if (state.players[i].hp <= 0) continue;
        int dx = state.players[i].x - state.npc_x;
        int dy = state.players[i].y - state.npc_y;
        int d = dx * dx + dy * dy;
        if (d < out_dist_sq) {
            out_dist_sq = d;
            best = &state.players[i];
        }
    }
    return best;
}

inline void move_up(GameState& s, const RoomMap&, bool npc_turn, int player_idx) {
    if (npc_turn) { s.npc_vx = 0; s.npc_vy = -1; }
    else if (s.players_count != 0) { s.players[player_idx].vx = 0; s.players[player_idx].vy = -1; }
}

inline void move_down(GameState& s, const RoomMap&, bool npc_turn, int player_idx) {
    if (npc_turn) { s.npc_vx = 0; s.npc_vy = 1; }
    else if (s.players_count != 0) { s.players[player_idx].vx = 0; s.players[player_idx].vy = 1; }
}

 inline void move_left(GameState& s, const RoomMap&, bool npc_turn, int player_idx) {
    if (npc_turn) { s.npc_vx = -1; s.npc_vy = 0; }
    else if (s.players_count != 0) { s.players[player_idx].vx = -1; s.players[player_idx].vy = 0; }
}

inline void move_right(GameState& s, const RoomMap&, bool npc_turn, int player_idx) {
    if (npc_turn) { s.npc_vx = 1; s.npc_vy = 0; }
    else if (s.players_count != 0) { s.players[player_idx].vx = 1; s.players[player_idx].vy = 0; }
}

inline void wait(GameState& s, const RoomMap&, bool npc_turn, int player_idx) {
    if (npc_turn) { s.npc_vx = 0; s.npc_vy = 0; }
    else if (s.players_count != 0) { s.players[player_idx].vx = 0; s.players[player_idx].vy = 0; }
}

inline void approach(GameState& s, const RoomMap&, bool npc_turn, int player_idx) {
    if (npc_turn) {
        int d; const Player* t = find_closest_player(s, d);
        s.npc_vx = t ? sign(t->x - s.npc_x) : 0;
        s.npc_vy = t ? sign(t->y - s.npc_y) : 0;
    }
    else if (s.players_count != 0) {
        s.players[player_idx].vx = sign(s.npc_x - s.players[player_idx].x);
        s.players[player_idx].vy = sign(s.npc_y - s.players[player_idx].y);
    }
}
inline void retreat(GameState& s, const RoomMap&, bool npc_turn, int player_idx) {
    if (npc_turn) {
        int d; const Player* t = find_closest_player(s, d);
        s.npc_vx = t ? -sign(t->x - s.npc_x) : 0;
        s.npc_vy = t ? -sign(t->y - s.npc_y) : 0;
    }
    else if (s.players_count != 0) {
        s.players[player_idx].vx = -sign(s.npc_x - s.players[player_idx].x);
        s.players[player_idx].vy = -sign(s.npc_y - s.players[player_idx].y);
    }
}

inline void strafe_left(GameState& s, const RoomMap&, bool npc_turn, int player_idx) { 
    move_left(s, {}, npc_turn, player_idx); 
}

inline void strafe_right(GameState& s, const RoomMap&, bool npc_turn, int player_idx) { 
    move_right(s, {}, npc_turn, player_idx); 
}

inline void attack(GameState& s, const RoomMap& map, bool npc_turn, int player_idx) {
    if (npc_turn) {
        s.npc_vx = 0; s.npc_vy = 0;
        int dist_sq;
        const Player* target = find_closest_player(s, dist_sq);
        if (!target || dist_sq > s.npc_range * s.npc_range) return;
        if (!map.has_line_of_sight(s.npc_x, s.npc_y, target->x, target->y)) return;
        for (Player& p : s.players) if (&p == target) { p.hp -= s.npc_damage; break; }
    }
    else if (s.players_count != 0) {
        Player& p = s.players[player_idx];
        p.vx = 0; p.vy = 0;
        int dx = s.npc_x - p.x, dy = s.npc_y - p.y;
        if (dx * dx + dy * dy > p.range * p.range) return;
        if (!map.has_line_of_sight(p.x, p.y, s.npc_x, s.npc_y)) return;
        s.npc_hp -= p.damage;
    }
}