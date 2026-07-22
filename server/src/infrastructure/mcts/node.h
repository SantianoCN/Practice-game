#pragma once
#include <memory>
#include <cmath>
#include <limits>
#include "action_types.h"
#include "game_state.h"

class Node {
    friend class Tree;
public:
    /// <summary>
    /// Данные
    /// </summary>
    GameState game_state;
    ActionType action;

    /// <summary>
    /// Указатели на следующие узлы и на предыдущий
    /// </summary>
    Node* parent = nullptr;
    std::vector<std::unique_ptr<Node>> children;

    /// <summary>
    /// Для рассчета UCT
    /// </summary>
    std::vector<ActionType> action_pull;
    double total_score = 0;
    int visits = 0;
    Node(GameState state, ActionType action, Node* parent = nullptr)
        : game_state(state), action(action), parent(parent) {
        std::vector<ActionType> actions;
        for (int i = static_cast<int>(ActionType::Attack);
            i < static_cast<int>(ActionType::MoveUp); i++) {
            actions.push_back(static_cast<ActionType>(i));
        }
        action_pull = actions;
    }

    double uct(int parent_visits, const double c) const;
    bool is_fully_expanded() const;
};

inline double Node::uct(int parent_visits, const double c) const {
    if (this->visits == 0) {
        return std::numeric_limits<double>::infinity();
    } 
    
    double avg_score = this->total_score / this->visits;
    double exploration = c * std::sqrt(std::log(parent_visits) / this->visits);
    
    return avg_score + exploration;
}

inline bool Node::is_fully_expanded() const {
    return this->action_pull.empty();
}