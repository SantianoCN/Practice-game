import { IGameRepository } from '../interfaces/IGameRepository';
import { IIdGenerator } from '../interfaces/IIdGenerator';
import { GameSession } from '../../domain/entities/GameSession';
import { EntityFactory } from '../../domain/factories/EntityFactory';
import { MapGenerator } from '../../domain/world/FloorGenerator';
import { GAME_CONFIG } from '@game/shared';

export class SessionManagementUseCase {
    private deleteTimers = new Map<string, ReturnType<typeof setTimeout>>();
    constructor(
        private repo: IGameRepository,
        private idGen: IIdGenerator,
        private roomWidth: number,
        private roomHeight: number
    ) {}

    public createSession(userId: string, login: string, archetype: string, weaponId: string): string {
        const sessionId = this.idGen.generateUUID('session');
        const session = new GameSession(sessionId, this.roomWidth, this.roomHeight);
        const mapGenerator = new MapGenerator(
            GAME_CONFIG.MAP_SIZE,
            15,
            this.roomWidth,
            this.roomHeight,
            (prefix) => this.idGen.generateId(prefix)
        );
        
        session.floorMap = mapGenerator.generate();
        

        this.repo.save(session);
        this.joinSession(sessionId, userId, login, archetype, weaponId);

        return sessionId;
    }

    public joinSession(sessionId: string, userId: string, login: string, archetype: string, weaponId: string): boolean {
        const session = this.repo.get(sessionId);
        if (!session) return false;

        const pendingTimer = this.deleteTimers.get(sessionId);
        if (pendingTimer) {
            clearTimeout(pendingTimer);
            this.deleteTimers.delete(sessionId);
        }

        const player = EntityFactory.createPlayer(
            userId, login, archetype, weaponId, 
            session.roomWidth / 2, session.roomHeight / 2, 
            (prefix) => this.idGen.generateId(prefix)
        );

        session.addPlayer(player);
        return true;
    }

    public leaveSession(sessionId: string, userId: string): void {
        const session = this.repo.get(sessionId);
        if (!session) return;

        session.removePlayer(userId);
        if (session.isEmpty()) {
            if (!this.deleteTimers.has(sessionId)) {
                const GRACE_PERIOD_MS = 15000;

                const timer = setTimeout(() => {
                    this.repo.delete(sessionId);
                    this.deleteTimers.delete(sessionId);
                }, GRACE_PERIOD_MS);

                this.deleteTimers.set(sessionId, timer);
            }
        }
    }
}