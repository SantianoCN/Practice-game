#include <utility>
#include "tree.h"

Node* Tree::get_root() const
{
    return root;
}

GameState Tree::get_current_state() const {
    return current_node->game_state;
}

ActionType Tree::get_current_action() const {
    return current_node->action;
}

bool Tree::is_fully_expanded() const {
    return current_node->action_pull.empty();
}

void Tree::initialize_node(Node* node) const {
    for (int i = static_cast<int>(ActionType::MoveUp);
        i <= static_cast<int>(ActionType::Attack); i++) {
        node->action_pull.push_back(static_cast<ActionType>(i));
    }
}

 
void Tree::reset(GameState state) {
    root_ptr = std::unique_ptr<Node>(new Node(state, ActionType::None));
    root = root_ptr.get();
    initialize_node(root);
    current_node = root;
}

ActionType Tree::get_next_untried() {
    if (current_node != nullptr) {
        if (current_node->action_pull.size() > 0) {
            ActionType action = current_node->action_pull.back();
            current_node->action_pull.pop_back();
            return action;
        }
    }
    return ActionType::None;
}

void Tree::select_best_uct(double c) {
    if (current_node != nullptr && !current_node->children.empty()) {
        double best = -std::numeric_limits<double>::infinity();
        Node* best_child = current_node->children[0].get();
        for (const std::unique_ptr<Node>& child_ptr : current_node->children) {
            Node* node = child_ptr.get();
            int parent_visits = 0;
            if (node->parent != nullptr) {
                parent_visits = node->parent->visits;
            }
            double uct = node->uct(parent_visits, c);
            if (uct > best) {
                best_child = node;
                best = uct;
            }
        }
        current_node = best_child;
    }
}

void Tree::expand_current(GameState next_state, ActionType next_action)
{
    if (current_node != nullptr)
    {
        std::unique_ptr<Node> child(
            new Node(next_state, next_action, current_node)
        );
        Node* child_ptr = child.get();
        initialize_node(child_ptr);

        current_node->children.push_back(std::move(child));
        current_node = child_ptr;
    }
}

void Tree::backpropagation(double reward) {
    current_node->total_score += reward;
    current_node->visits++;

    while (current_node->parent != nullptr) {
        current_node = current_node->parent;
        current_node->total_score += reward;
        current_node->visits++;
    }
    current_node = root;
}

/// <summary>
/// Поиск лучшего действия от корня
/// </summary>
/// <returns>
/// Возвращает лучшее действие
/// </returns>
ActionType Tree::best_action_by_visits() {
    Node* best = root->children[0].get();
    for (const std::unique_ptr<Node>& node : root->children) {
        if (node->visits > best->visits) {
            best = node.get();
        }
    }
    return best->action;
}