import { IdGenerator } from "../../domain/utils/IDGenerator";
import { GameEngine } from "../../domain/engines/GameEngine";
import { PlayerAction, GameSnapshot } from '../../../../shared/gameTypes';

export default class GameManager {
    private sessions: Map<string, GameEngine> = new Map();
    // <sessionId, userId[]>
    private playerSessions: Map<string, string[]> = new Map();

    public createSession(): string {
        const uuid = IdGenerator.generateUUID('session');
        const engine = new GameEngine(uuid);
        this.sessions.set(uuid, engine);
        console.log('[GameManager] создана сессия: ', uuid);
        return uuid;
    }

    public getSession(sessionId: string): GameEngine | null {
        const engine = this.sessions.get(sessionId);
        if (!engine) return null;
        return engine;
    }

    public sessionExists(sessionId: string): boolean {
        return this.sessions.has(sessionId);
    }

    public removeSession(sessionId: string): void {
        const engine = this.sessions.get(sessionId);
        if (!engine) return;
        engine.stop();
        this.sessions.delete(sessionId);
        console.log('[GameManager] удалена сессия: ', sessionId);
    }

    public addPlayer(
        sessionId: string,
        userId: string,
        name: string,
        archetype: string,
        weaponId: string
    ): { success: boolean, message?: string } {
        const isPlayerInSession = Array.from(this.playerSessions.values())
            .some(userIds => userIds.includes(userId));
        if (isPlayerInSession) {
            return {
                success: false,
                message: 'игрок уже в сессии'
            };
        }
        const engine = this.getSession(sessionId);
        if (!engine) return {
            success: false,
            message: 'сессия не найдена'
        }
        engine.addPlayer(userId, name, weaponId, archetype);
        const session = this.playerSessions.get(sessionId);
        if (!session) {
            this.playerSessions.set(sessionId, [userId]);
        } else {
            session?.push(userId);
        }
        console.log('[GameManager] список игроков в сессиях', this.playerSessions.values());
        return { success: true }
    }

    public removePlayer(
        sessionId: string,
        userId: string
    ): void {
        const engine = this.getSession(sessionId);
        if (!engine) return;

        engine.removePlayer(userId);
        const players = this.playerSessions.get(sessionId);
        if (players) {
            const index = players.indexOf(userId);
            if (index !== -1) {
                players.splice(index, 1);
            }
            if (players.length === 0) {
                this.playerSessions.delete(sessionId);
                this.removeSession(sessionId);
            }
        }
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