#pragma once
#include <climits>
#include <iostream>
#include "game_state.h"
#include "room_map.h"

inline Position find_pos_on_range(Position npc, Position target, int range, const RoomMap& map) {
	double dx = npc.x - target.x;
	double dy = npc.y - target.y;
	double base_angle = std::atan2(dy, dx);

	double angle = base_angle + (rand() % 180 - 90) * 3.14 / 180.0f;
	int px = target.x + std::cos(angle) * range;
	int py = target.y + std::sin(angle) * range;

	if (map.is_wall(px, py)) {
		for (int i = 0; i < 12; i++) {
			angle = base_angle + (rand() % 180 - 90) * 3.14 / 180.0f;
			px = target.x + std::cos(angle) * range;
			py = target.y + std::sin(angle) * range;
			if (!map.is_wall(px, py)) break;
		}
	}

	return Position(px, py);
}

inline Player* find_closest_player(GameState& state) {
	Player* best = nullptr;
	int min_dist = INT_MAX;
	for (int i = 0; i < state.players_count; i++) {
		if (state.players[i].hp <= 0) continue;
		int dx = state.players[i].x - state.npc_x;
		int dy = state.players[i].y - state.npc_y;
		int dist = sqrt(dx * dx + dy * dy);
		if (dist < min_dist) {
			min_dist = dist;
			best = &state.players[i];
		}
	}
	return best;
}

inline Position update_position(Position pos, int vx, int vy, int speed, int delta_time = 1) {
	int length = std::sqrt(vx * vx + vy * vy);
	if (length < 1e-6) return pos;
	int x = pos.x + (vx / length) * speed * delta_time;
	int y = pos.y + (vy / length) * speed * delta_time;
	return Position(x, y);
}

inline void update_positions(GameState& state, RoomMap& map) {
	for (int i = 0; i < state.players_count; i++) {
		Player& player = state.players[i];
		auto pos = update_position(Position(player.x, player.y), player.vx, player.vy, 1);
		if (!map.is_wall(pos.x, pos.y)) {
			player.x = pos.x;
			player.y = pos.y;
		}
	}

	auto npc_pos = update_position( 
		Position(state.npc_x, state.npc_y),
		state.npc_vx,
		state.npc_vy,
		state.npc_speed
	);
	if (!map.is_wall(npc_pos.x, npc_pos.y)) {
		state.npc_x = npc_pos.x;
		state.npc_y = npc_pos.y;
	}
}

inline void player_attack(GameState& state, const RoomMap& map, bool npc_turn, int player_idx) {
	if (npc_turn) return;

	Player& player = state.players[player_idx];
	if (player.hp <= 0) return;

	if (map.has_line_of_sight(player.x, player.y, state.npc_x, state.npc_y)) {
		int dx = state.npc_x - player.x;
		int dy = state.npc_y - player.y;
		int distance = sqrt(dx * dx + dy * dy); 
		if (distance <= player.range)
			state.npc_hp -= player.damage;
	}
}


inline void player_move_closer(GameState& state, const RoomMap& map, bool npc_turn, int player_idx) {
	if (npc_turn) return;

	Player& player = state.players[player_idx];
	if (player.hp <= 0) return;

	int dx = state.npc_x - player.x;
	int dy = state.npc_y - player.y;
	int dist = std::sqrt(dx * dx + dy * dy);

	if (dist > 0) {
		int nx = player.x + (dx / dist) * player.speed;
		int ny = player.y + (dy / dist) * player.speed;

		if (!map.is_wall(nx, ny)) {
			player.x = nx;
			player.y = ny;
		}
	}
}

inline void player_move_away(GameState& state, const RoomMap& map, bool npc_turn, int player_idx) {
	if (npc_turn) return;

	Player& player = state.players[player_idx];
	if (player.hp <= 0) return;

	int dx = player.x - state.npc_x;
	int dy = player.y - state.npc_y;
	int dist = std::sqrt(dx * dx + dy * dy);

	if (dist > 0) {
		int nx = player.x + (dx / dist) * player.speed;
		int ny = player.y + (dy / dist) * player.speed;

		if (!map.is_wall(nx, ny)) {
			player.x = nx;
			player.y = ny;
		}
	}
}


inline void follow_path(GameState& state, const Position to_pos, const RoomMap& map) {
	std::vector<Position> path = map.find_path(
		state.npc_x,
		state.npc_y, 
		to_pos.x, 
		to_pos.y
	);
	for (const Position& pos : path) {
		state.npc_x = pos.x;
		state.npc_y = pos.y;
	}
}

inline void try_attack(GameState& state, Player* target, const RoomMap& map) {
	if (map.has_line_of_sight(state.npc_x, state.npc_y, target->x, target->y)) {
		int dx = target->x - state.npc_x;
		int dy = target->y - state.npc_y;
		int distance = sqrt(dx * dx + dy * dy);
		if (distance <= state.npc_range)
			target->hp -= state.npc_damage;
		
	}
}

inline void wait(GameState& state, const RoomMap& map, bool npc_turn, int player_idx) {}

inline int get_dist(Position npc, Position target) {
	int dx = target.x - npc.x;
	int dy = target.y - npc.y; 
	return sqrt(dx * dx + dy * dy); 
}


inline void engage(GameState& state, const RoomMap& map, bool npc_turn, int player_idx) {
	if (!npc_turn) return;

	auto target = find_closest_player(state);
	auto target_pos = Position(target->x, target->y);
	auto npc_pos = Position(state.npc_x, state.npc_y);
	target_pos = find_pos_on_range(npc_pos, target_pos, state.npc_range, map);
	follow_path(state, target_pos, map);
	try_attack(state, target, map);
}	

inline void kite(GameState& state, const RoomMap& map, bool npc_turn, int player_idx) {
	if (!npc_turn) return;

	auto target = find_closest_player(state);
	if (!target) return;

	auto target_pos = Position(target->x, target->y);
	auto npc_pos = Position(state.npc_x, state.npc_y);

	if (get_dist(npc_pos, target_pos) < state.npc_range) {
		int dx = state.npc_x - target->x;
		int dy = state.npc_y - target->y;
		int dist = std::sqrt(dx * dx + dy * dy);

		if (dist > 0) {
			int retreat_x = state.npc_x + (dx / dist) * (state.npc_range - dist + 50);
			int retreat_y = state.npc_y + (dy / dist) * (state.npc_range - dist + 50);

			if (!map.is_wall(retreat_x, retreat_y)) {
				follow_path(state, Position(retreat_x, retreat_y), map);
			}
		}
	}
	try_attack(state, target, map);
}

inline void flank(GameState& state, const RoomMap& map, bool npc_turn, int player_idx) {
	if (!npc_turn) return;

	auto target = find_closest_player(state);
	if (!target) return;

	auto target_pos = Position(target->x, target->y);
	auto npc_pos = Position(state.npc_x, state.npc_y);

	int dx = state.npc_x - target->x;
	int dy = state.npc_y - target->y;
	int dist = std::sqrt(dx * dx + dy * dy);

	if (dist > 0) {
		int base_angle = std::atan2(dy, dx);

		int offset = (rand() % 180 + 90) * 3.14f / 180.0f;
		if (rand() % 2 == 0) offset = -offset;

		int flank_angle = base_angle + offset;

		int flank_x = target->x + std::cos(flank_angle) * state.npc_range;
		int flank_y = target->y + std::sin(flank_angle) * state.npc_range;

		if (!map.is_wall(flank_x, flank_y)) {
			follow_path(state, Position(flank_x, flank_y), map);
		}
	}
}

inline void retreat(GameState& state, const RoomMap& map, bool npc_turn, int player_idx) {
	if (!npc_turn) return;

	auto target = find_closest_player(state);
	if (!target) return;

	int dx = state.npc_x - target->x;
	int dy = state.npc_y - target->y;
	int dist = std::sqrt(dx * dx + dy * dy);

	if (dist == 0) {
		int angle = rand() % 360;
		int retreat_x = state.npc_x + std::cos(angle * 3.14 / 180) * state.npc_range * 1.5;
		int retreat_y = state.npc_y + std::sin(angle * 3.14 / 180) * state.npc_range * 1.5;
		if (!map.is_wall(retreat_x, retreat_y)) {
			follow_path(state, Position(retreat_x, retreat_y), map);
		}
		return;
	}

	int retreat_dist = state.npc_range * 1.5;
	int retreat_x = state.npc_x + (dx * retreat_dist) / dist;
	int retreat_y = state.npc_y + (dy * retreat_dist) / dist;

	if (map.is_wall(retreat_x, retreat_y)) {
		for (int angle = 30; angle <= 150; angle += 30) {
			for (int sign : {-1, 1}) {
				int a = angle * sign;
				int rx = (dx * std::cos(a * 3.14 / 180) - dy * std::sin(a * 3.14 / 180)) * retreat_dist / dist;
				int ry = (dx * std::sin(a * 3.14 / 180) + dy * std::cos(a * 3.14 / 180)) * retreat_dist / dist;

				int tx = state.npc_x + rx;
				int ty = state.npc_y + ry;

				if (!map.is_wall(tx, ty)) {
					retreat_x = tx;
					retreat_y = ty;
					break;
				}
			}
			if (!map.is_wall(retreat_x, retreat_y)) break;
		}
	}

	follow_path(state, Position(retreat_x, retreat_y), map);
}