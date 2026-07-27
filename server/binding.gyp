{
  "targets": [
    {
      "target_name": "mcts",
      "include_dirs": [
        ".",
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "sources": [
        "src/infrastructure/mcts/mcts_bridge.cpp",
        "src/infrastructure/mcts/game_engine.cpp",
        "src/infrastructure/mcts/mcts.cpp",
        "src/infrastructure/mcts/tree.cpp",
        "src/infrastructure/mcts/action_module.h"
      ],
      "defines": [
        "NAPI_VERSION=6"
      ],
      "cflags": [
        "-std=c++17"
      ],
      "conditions": [
        [
          "OS=='win'",
          {
            "msvs_settings": {
              "VCCLCompilerTool": {
                "AdditionalOptions": [
                  "/std:c++17",
                  "/EHsc"
                ]
              }
            }
          }
        ]
      ]
    }
  ]
}