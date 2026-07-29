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
      "defines": [
        "NODE_ADDON_API_DISABLE_CPP_EXCEPTIONS"
      ],
      "cflags_cc": [
        "-std=c++17"
      ],
      "xcode_settings": {
        "CLANG_CXX_LANGUAGE_STANDARD": "c++17"
      }
    }
  ]
}