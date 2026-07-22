#pragma once
#include <vector>
#include <cstdlib>

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
        if (x < 0 || x >= width || y < 0 || y >= height) {
            return true;
        }
        for (const Obstacle& ob : obstacles) {
            if (x >= ob.x && x < ob.x + ob.width &&
                y >= ob.y && y < ob.y + ob.height) {
                return true;
            }
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
};