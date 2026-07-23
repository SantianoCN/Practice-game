{
  "targets": [
    {
      "target_name": "mcts",
      "sources": [
        "src/infrastructure/mcts/mcts_bridge.cpp",
        "src/infrastructure/mcts/game_engine.cpp",
        "src/infrastructure/mcts/mcts.cpp",
        "src/infrastructure/mcts/tree.cpp",
        "src/infrastructure/mcts/action_module.h"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "cflags_cc": [ "-fexceptions", "-std=c++17" ],
      "defines": [ "NAPI_CPP_EXCEPTIONS" ]
    }
  ]
}