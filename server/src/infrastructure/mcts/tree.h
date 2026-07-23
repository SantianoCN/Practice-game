#pragma once
#include <utility>
#include "node.h"

class Tree {
private:
    std::unique_ptr<Node> root_ptr;

    Node* root = nullptr;
    Node* current_node = nullptr;

    void initialize_node(Node* node) const;
public:
    Tree() {}
    Tree(GameState current_state) {
        root_ptr = std::unique_ptr<Node>(
            new Node(current_state, ActionType::None)
        );
        root = root_ptr.get();
        current_node = root;
    }
    Node* get_root() const;
    void reset(GameState state);

    GameState get_current_state() const;
    ActionType get_current_action() const;
    ActionType get_next_untried();

    bool is_fully_expanded() const;
    void expand_current(GameState state, ActionType action);
    void select_best_uct(double c);
    void backpropagation(double reward);
    ActionType best_action_by_visits();
};