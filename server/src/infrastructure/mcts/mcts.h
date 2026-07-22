#pragma once
#include "tree.h"
#include "game_engine.h"

class MCTS {
private:
    Tree tree;
    GameEngine& engine;
    int max_iterations;
    double c_value;

    void selection();
    void expansion();
    double simulation();
    void backpropagation(double score);
public:
    MCTS(GameEngine& game_engine, int iterations, double c) 
        : engine(game_engine) {
        max_iterations = iterations;    
        c_value = c;
    }

    void print_stat();
    ActionType find_best_action(GameState state);
};