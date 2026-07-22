#include "mcts.h"

/// <summary>
/// Фасад для поиска лучшего действия
/// </summary>
/// <param name="state"> Игровое состояние на момент рассчета </param>
/// <returns></returns>
ActionType MCTS::find_best_action(GameState state) {
    tree.reset(state);
    if (engine.is_terminal(state)) return ActionType::None;

    for (int i = 0; i < max_iterations; i++) {
        selection();
        if (!tree.is_fully_expanded()) {
            expansion();
        }
        double reward = simulation();
        backpropagation(reward);
    }
    return tree.best_action_by_visits();
}

void MCTS::print_stat() {
    for (auto& child : tree.get_root()->children) { 
        std::cout << action_names[(int)child->action] << " visits=" << child->visits
            << " score=" << child->total_score << std::endl;
    }
}

void MCTS::selection() {
    while (tree.is_fully_expanded()
        && !engine.is_terminal(tree.get_current_state())) {
        tree.select_best_uct(c_value);
    }
}

void MCTS::expansion() {
    ActionType action = tree.get_next_untried();
    GameState state = tree.get_current_state();
    if (action != ActionType::None && !engine.is_terminal(state)) {
        engine.apply_action(state, action, true);
        tree.expand_current(state, action);
    }
}

double MCTS::simulation() {
    GameState state = tree.get_current_state();
    return engine.rollout(state);
}

void MCTS::backpropagation(double reward) {
    tree.backpropagation(reward);
}