#pragma once
#include <vector>
#include <cstdlib>
#include <queue>
#include <unordered_set>
#include <unordered_map>
#include "position.h"
#include <algorithm>

struct Obstacle {
    int x;
    int y;
    int width;
    int height;
};

struct RoomMap {
    std::vector<Obstacle> obstacles;
    int width;
    int height;

    bool is_wall(int x, int y) const {
        if (x < 0 || x >= width || y < 0 || y >= height) return true;
        for (const Obstacle& ob : obstacles) {
            int left = ob.x - ob.width / 2, right = ob.x + ob.width / 2;
            int top = ob.y - ob.height / 2, bottom = ob.y + ob.height / 2;
            if (x >= left && x < right && y >= top && y < bottom) return true;
        }
        return false;
    }

    bool has_line_of_sight(int npc_x, int npc_y, int target_x, int target_y) const {
        int dx = std::abs(target_x - npc_x);
        int dy = std::abs(target_y - npc_y);
        int sx = (npc_x < target_x) ? 1 : -1;
        int sy = (npc_y < target_y) ? 1 : -1;
        int err = dx - dy;
        int x = npc_x;
        int y = npc_y;

        while (true) {
            if (x != npc_x || y != npc_y) {
                if (is_wall(x, y)) {
                    return false;
                }
            }

            if (x == target_x && y == target_y) {
                return true;
            }

            int e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
    }

    std::vector<Position> find_path(int from_x, int from_y, int to_x, int to_y, int cell_size = 20) const {
        std::vector<Position> result;
        if (has_line_of_sight(from_x, from_y, to_x, to_y)) {
            result.push_back(Position(to_x, to_y));
            return result;
        }

        int cols = (width + cell_size - 1) / cell_size;
        int rows = (height + cell_size - 1) / cell_size;
        int sx = from_x / cell_size, sy = from_y / cell_size;
        int gx = to_x / cell_size, gy = to_y / cell_size;
        if (sx == gx && sy == gy) return result;

        auto cell_walkable = [&](int cx, int cy) {
            return !is_wall(cx * cell_size + cell_size / 2, cy * cell_size + cell_size / 2);
            };
        auto key = [&](int x, int y) { return y * cols + x; };

        std::queue<std::pair<int, int>> q;
        std::unordered_set<int> visited;
        std::unordered_map<int, int> came_from;
        q.push({ sx, sy });
        visited.insert(key(sx, sy));

        static const int dxs[4] = { 0, 0, -1, 1 };
        static const int dys[4] = { -1, 1, 0, 0 };
        bool found = false;

        while (!q.empty()) {
            auto [cx, cy] = q.front(); q.pop();
            if (cx == gx && cy == gy) { found = true; break; }
            for (int d = 0; d < 4; ++d) {
                int nx = cx + dxs[d], ny = cy + dys[d];
                if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
                if (!cell_walkable(nx, ny)) continue;
                int k = key(nx, ny);
                if (visited.count(k)) continue;
                visited.insert(k);
                came_from[k] = key(cx, cy);
                q.push({ nx, ny });
            }
        }
        if (!found) return result;

        std::vector<std::pair<int, int>> cells;
        int cur = key(gx, gy);
        int start_key = key(sx, sy);
        while (cur != start_key) {
            cells.push_back({ cur % cols, cur / cols });
            cur = came_from[cur];
        }
        std::reverse(cells.begin(), cells.end());

        for (auto& [cx, cy] : cells) {
            result.push_back(Position(cx * cell_size + cell_size / 2, cy * cell_size + cell_size / 2));
        }
        return result;
    }
};