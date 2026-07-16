import { PlayerActionDTO } from '@game/shared';
import { IGameRepository } from '../interfaces/IGameRepository';
import { IIdGenerator } from '../interfaces/IIdGenerator';

export class ProcessInputUseCase {
    constructor(
        private repo: IGameRepository,
        private idGen: IIdGenerator
    ) {}

    public execute(sessionId: string, userId: string, action: PlayerActionDTO, currentTime: number): void {
        const session = this.repo.get(sessionId);
        if (!session) return;

        const player = session.getPlayer(userId);
        if (!player || player.isDead()) return;

        player.applyInput(action.keys.up, action.keys.down, action.keys.left, action.keys.right);

        if (action.keys.weapon1) player.changeWeapon(0);
        if (action.keys.weapon2) player.changeWeapon(1);
        if (action.keys.weapon3) player.changeWeapon(2);

        if (action.keys.attack) {
            const room = session.getRoom(player.roomX, player.roomY);
            if (!room) return;

            const weapon = player.getActiveWeapon();

            let dirX = 1;
            let dirY = 0;
            const aliveEnemies = room.enemies.filter(e => !e.isDead());
            
            if (aliveEnemies.length > 0) {
                const target = aliveEnemies.reduce((prev, curr) => {
                    const dPrev = Math.hypot(prev.x - player.x, prev.y - player.y);
                    const dCurr = Math.hypot(curr.x - player.x, curr.y - player.y);
                    return dCurr < dPrev ? curr : prev;
                });
                
                const dist = Math.hypot(target.x - player.x, target.y - player.y);
                dirX = (target.x - player.x) / dist;
                dirY = (target.y - player.y) / dist;
            }

            const bulletId = this.idGen.generateId('bullet');
            const bullet = weapon.fire(bulletId, player.id, 'player', player.x, player.y, dirX, dirY, currentTime);
            
            if (bullet) {
                room.bullets.push(bullet); 
            }
        }
    }
}