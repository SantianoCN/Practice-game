import { PlayerActionDTO } from '@game/shared';
import { IGameRepository } from '../interfaces/IGameRepository';

export class ProcessInputUseCase {
    constructor(
        private repo: IGameRepository
    ) {}

    public execute(sessionId: string, userId: string, action: PlayerActionDTO): void {
        const session = this.repo.get(sessionId);
        if (!session) return;

        const player = session.getPlayer(userId);
        if (!player || player.isDead()) return;

        player.inputQueue.push(action.keys);

        if (action.keys.weapon1) player.changeWeapon(0);
        if (action.keys.weapon2) player.changeWeapon(1);
        if (action.keys.weapon3) player.changeWeapon(2);
    }
}