"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessInputUseCase = void 0;
class ProcessInputUseCase {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    execute(sessionId, userId, action) {
        const session = this.repo.get(sessionId);
        if (!session)
            return;
        const player = session.getPlayer(userId);
        if (!player || player.isDead())
            return;
        player.inputQueue.push(action.keys);
        if (action.keys.weapon1)
            player.changeWeapon(0);
        if (action.keys.weapon2)
            player.changeWeapon(1);
        if (action.keys.weapon3)
            player.changeWeapon(2);
    }
}
exports.ProcessInputUseCase = ProcessInputUseCase;
