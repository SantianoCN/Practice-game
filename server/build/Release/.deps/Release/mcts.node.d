cmd_Release/mcts.node := ln -f "Release/obj.target/mcts.node" "Release/mcts.node" 2>/dev/null || (rm -rf "Release/mcts.node" && cp -af "Release/obj.target/mcts.node" "Release/mcts.node")
