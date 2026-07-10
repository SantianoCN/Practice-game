import { IdGenerator } from "../utils/IDGenerator";
import { GameEngine } from "./GameEngine";
import { PlayerAction, GameSnapshot } from '../../../shared/gameTypes';

export default class GameManager {
    private sessions: Map<string, GameEngine> = new Map();

    public createSession(): string {
        const uuid = IdGenerator.generateUUID('session');
        const engine = new GameEngine(uuid);    // uuid?
        this.sessions.set(uuid, engine); 
        return uuid;
    }

    public getSession(sessionId: string): GameEngine | null {
        const engine = this.sessions.get(sessionId);
        if (!engine) return null;
        return engine;
    }

    public sessionExists(sessionId: string): boolean {
        return this.sessions.get(sessionId) !== null;
    }

    public removeSession(sessionId: string): void {
        const engine = this.sessions.get(sessionId);
        if (!engine) return;
        engine.stop();
        this.sessions.delete(sessionId);
    }

    public addPlayer(
        sessionId: string, 
        userId: string, 
        name: string,
        archetype: 'warrior' | 'mage',
        emitCallback: (snapshot: GameSnapshot) => void
    ): void {
        const engine = this.getSession(sessionId);
        if (!engine) return;
        engine.addPlayer(userId, name, archetype, emitCallback);
    }

    public removePlayer(
        sessionId: string, 
        userId: string
    ): void {
        const engine = this.getSession(sessionId); 
        if (!engine) return;
    
        // Просто удаляем игрока из движка, но НЕ удаляем саму сессию!
        engine.removePlayer(userId); 
        
        /* УДАЛИТЕ ИЛИ ЗАКОММЕНТИРУЙТЕ ЭТОТ БЛОК:
        if (engine.removePlayer(userId)) {
            this.removeSession(sessionId); 
        }
        */
    }

    public pushInput(
        sessionId: string,
        userId: string, 
        actionData: PlayerAction
    ): void {
        const engine = this.getSession(sessionId);
        if (!engine) return;
        engine.pushInput(userId, actionData);
    }
}