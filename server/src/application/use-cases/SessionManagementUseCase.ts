import { IGameRepository } from '../interfaces/IGameRepository';
import { IIdGenerator } from '../interfaces/IIdGenerator';
import { GameSession } from '../state/GameSession';
import { EntityFactory } from '../../domain/factories/EntityFactory';
import { MapGenerator } from '../../domain/world/MapGenerator';

export class SessionManagementUseCase {
    constructor(
        private repo: IGameRepository,
        private idGen: IIdGenerator,
        private config: { roomWidth: number, roomHeight: number }
    ) {}

    public createSession(userId: string, login: string, archetype: string, weaponId: string): string {
        const sessionId = this.idGen.generateUUID('session');
        const session = new GameSession(sessionId, this.config.roomWidth, this.config.roomHeight);
        const mapGenerator = new MapGenerator(
            10,                     // Размер сетки (10x10)
            15,                     // Целевое количество комнат
            this.config.roomWidth,  // 800
            this.config.roomHeight, // 600
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
            this.repo.delete(sessionId);
        }
    }
}