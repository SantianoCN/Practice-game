import { IGameRepository } from '../interfaces/IGameRepository';
import { IIdGenerator } from '../interfaces/IIdGenerator';
import { GameSession } from '../../domain/entities/GameSession';
import { EntityFactory } from '../../domain/factories/EntityFactory';
import { MapGenerator } from '../../domain/world/FloorGenerator';
import { GAME_CONFIG, GAME_DIFFICULTY } from '@game/shared';
import { IPresetProvider } from '../interfaces/IPresetProvider';
import { ISaveRepository } from '../interfaces/ISaveRepository';

export interface HostMigrationResult {
    migrated: boolean;
    newHostAccountId?: string;
    remainingOnlineAccountIds: string[];
}

export class SessionManagementUseCase {
    private deleteTimers = new Map<string, ReturnType<typeof setTimeout>>();
    private reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
    private accountSessionMap = new Map<string, string>();

    constructor(
        private repo: IGameRepository,
        private idGen: IIdGenerator,
        private presetProvider: IPresetProvider,
        private roomWidth: number,
        private roomHeight: number,
        private saveRepo: ISaveRepository
    ) {}

    public getSession(sessionId: string): GameSession | undefined {
        return this.repo.get(sessionId);
    }

    public findActiveSessionByAccountId(accountId: string): string | undefined {
        const sessionId = this.accountSessionMap.get(accountId);
        if (!sessionId) return undefined;
        if (!this.repo.get(sessionId)) {
            this.accountSessionMap.delete(accountId);
            return undefined;
        }
        return sessionId;
    }

    public terminateSession(sessionId: string): void {
        const pendingTimer = this.deleteTimers.get(sessionId);
        if (pendingTimer) {
            clearTimeout(pendingTimer);
            this.deleteTimers.delete(sessionId);
        }

        const session = this.repo.get(sessionId);
        if (session) {
            for (const accountId of session.allowedAccountIds) {
                if (this.accountSessionMap.get(accountId) === sessionId) {
                    this.accountSessionMap.delete(accountId);
                }
            }
        }

        const reconnectPrefix = `${sessionId}:`;
        for (const key of Array.from(this.reconnectTimers.keys())) {
            if (key.startsWith(reconnectPrefix)) {
                clearTimeout(this.reconnectTimers.get(key)!);
                this.reconnectTimers.delete(key);
            }
        }

        this.repo.delete(sessionId);
    }

    public terminateSessionWithNotification(sessionId: string, message: string, io: any): void {
        const session = this.repo.get(sessionId);
        if (!session) return;

        for (const player of session.players.values()) {
            if (player.isOnline) {
                io.to(player.id).emit('server:session-terminated', { message });
            }
        }
        this.terminateSession(sessionId);
    }

    private addPlayerToSession(session: GameSession, accountId: string, login: string, archetype: string, weaponId: string): void {
        const pendingTimer = this.deleteTimers.get(session.sessionId);
        if (pendingTimer) {
            clearTimeout(pendingTimer);
            this.deleteTimers.delete(session.sessionId);
        }

        const player = EntityFactory.createPlayer(
            accountId,
            login,
            archetype, 
            weaponId,
            session.roomWidth / 2, 
            session.roomHeight / 2,
            (prefix) => this.idGen.generateId(prefix)
        );

        player.roomX = Math.floor(GAME_CONFIG.MAP_SIZE / 2);
        player.roomY = Math.floor(GAME_CONFIG.MAP_SIZE / 2);

        session.addPlayer(player);
        session.allowedAccountIds.add(accountId);
        this.accountSessionMap.set(accountId, session.sessionId);
    }

    public createSession(accountId: string, login: string, archetype: string, weaponId: string): string {
        const sessionId = this.idGen.generateUUID(6);
        const session = new GameSession(sessionId, this.roomWidth, this.roomHeight, GAME_DIFFICULTY.LVL1);

        session.isLobby = false;
        session.isSingleplayer = true;
        session.hostAccountId = accountId;

        const mapGenerator = new MapGenerator(
            GAME_CONFIG.MAP_SIZE,
            session.difficulty,
            session.roomWidth,
            session.roomHeight,
            (prefix) => this.idGen.generateId(prefix),
            (id) => this.presetProvider.getChestPreset(id)
        );

        session.floorMap = mapGenerator.generate();
        this.repo.save(session);
        this.addPlayerToSession(session, accountId, login, archetype, weaponId);

        return sessionId;
    }

    public createLobby(accountId: string, login: string, archetype: string, weaponId: string): string {
        const sessionId = this.idGen.generateUUID(6);
        const session = new GameSession(sessionId, this.roomWidth, this.roomHeight, GAME_DIFFICULTY.LVL1);

        session.isLobby = true;
        session.isSingleplayer = false;
        session.hostAccountId = accountId;

        const mapGenerator = new MapGenerator(
            GAME_CONFIG.MAP_SIZE,
            session.difficulty,
            session.roomWidth,
            session.roomHeight,
            (prefix) => this.idGen.generateId(prefix),
            (id) => this.presetProvider.getChestPreset(id)
        );

        session.floorMap = mapGenerator.generateLobby();
        this.repo.save(session);
        this.addPlayerToSession(session, accountId, login, archetype, weaponId);

        return sessionId;
    }

    public async loadRestoredSession(
        saveId: string, 
        requestingAccountId: string
    ): Promise<{ sessionId: string; isSingleplayer: boolean } | null> {
        const session = await this.saveRepo.loadRun(saveId);
        if (!session) return null;

        await this.saveRepo.deleteRun(saveId);
        session.sessionId = this.idGen.generateUUID(6);

        const hostPlayer = session.getPlayer(requestingAccountId);
        if (!hostPlayer) return null;

        if (!hostPlayer) return null;

        session.isRestoredSave = true;

        for (const p of session.players.values()) {
            this.accountSessionMap.set(p.id, session.sessionId);
        }

        hostPlayer.id = requestingAccountId;
        hostPlayer.name = hostPlayer.name;
        hostPlayer.isOnline = true;
        hostPlayer.vx = 0;
        hostPlayer.vy = 0;
        hostPlayer.lastBroadcastedRoomX = null;
        hostPlayer.lastBroadcastedRoomY = null;

        session.hostAccountId = requestingAccountId;

        const mapGenerator = new MapGenerator(
            GAME_CONFIG.MAP_SIZE,
            session.difficulty,
            this.roomWidth,
            this.roomHeight,
            (prefix) => this.idGen.generateId(prefix),
            (id) => this.presetProvider.getChestPreset(id)
        );

        const startX = Math.floor(GAME_CONFIG.MAP_SIZE / 2);
        const startY = Math.floor(GAME_CONFIG.MAP_SIZE / 2);

        if (session.isSingleplayer) {
            session.isLobby = false;
            session.floorMap = mapGenerator.generate();
            
            hostPlayer.roomX = startX;
            hostPlayer.roomY = startY;
            hostPlayer.x = session.roomWidth / 2;
            hostPlayer.y = session.roomHeight / 2;
        } else {
            session.isLobby = true;
            session.floorMap = mapGenerator.generateLobby();

            hostPlayer.roomX = startX;
            hostPlayer.roomY = startY;
            hostPlayer.x = session.roomWidth / 2;
            hostPlayer.y = session.roomHeight / 2;
        }

        this.repo.save(session);
        return { sessionId: session.sessionId, isSingleplayer: session.isSingleplayer };
    }

    public joinLobby(sessionId: string, accountId: string, login: string, archetype: string, weaponId: string): boolean {
        const session = this.repo.get(sessionId);
        if (!session || !session.isLobby) return false;

        if (session.isRestoredSave) {
            if (!session.allowedAccountIds.has(accountId) && session.players.size >= GAME_CONFIG.MAX_PLAYERS_PER_ROOM) {
                return false;
            }

            const existingPlayer = session.getPlayer(accountId);

            if (existingPlayer) {
                session.removePlayer(existingPlayer.id);
                existingPlayer.id = accountId;
                existingPlayer.name = login;
                existingPlayer.isOnline = true;
                existingPlayer.roomX = Math.floor(GAME_CONFIG.MAP_SIZE / 2);
                existingPlayer.roomY = Math.floor(GAME_CONFIG.MAP_SIZE / 2);
                existingPlayer.x = this.roomWidth / 2;
                existingPlayer.y = this.roomHeight / 2;
                existingPlayer.vx = 0;
                existingPlayer.vy = 0;
                existingPlayer.lastBroadcastedRoomX = null;
                existingPlayer.lastBroadcastedRoomY = null;

                session.addPlayer(existingPlayer);
                this.accountSessionMap.set(accountId, sessionId);

                const reconnectKey = `${sessionId}:${accountId}`;
                const pendingTimer = this.reconnectTimers.get(reconnectKey);
                if (pendingTimer) {
                    clearTimeout(pendingTimer);
                    this.reconnectTimers.delete(reconnectKey);
                }

                return true;
            }
            return false;
        }

        this.addPlayerToSession(session, accountId, login, archetype, weaponId);
        return true;
    }

    public startMatch(sessionId: string, accountId: string): boolean {
        const session = this.repo.get(sessionId);
        if (!session || !session.isLobby) return false;
        if (session.hostAccountId !== accountId) return false;
        const activePlayerCount = Array.from(session.players.values()).filter(p => !p.isDead() && p.isOnline).length || 1;

        const mapGenerator = new MapGenerator(
            GAME_CONFIG.MAP_SIZE,
            session.difficulty,
            session.roomWidth,
            session.roomHeight,
            (prefix) => this.idGen.generateId(prefix),
            (id) => this.presetProvider.getChestPreset(id),
            activePlayerCount
        );

        session.floorMap = mapGenerator.generate();
        session.isLobby = false;

        const startX = Math.floor(GAME_CONFIG.MAP_SIZE / 2);
        const startY = Math.floor(GAME_CONFIG.MAP_SIZE / 2);

        for (const player of session.players.values()) {
            if (!player.isOnline) continue;
            player.roomX = startX;
            player.roomY = startY;
            player.x = session.roomWidth / 2;
            player.y = session.roomHeight / 2;
            player.vx = 0;
            player.vy = 0;
            player.lastBroadcastedRoomX = null;
            player.lastBroadcastedRoomY = null;
        }

        return true;
    }

    

    private migrateHostIfNeeded(session: GameSession, departingAccountId: string): HostMigrationResult {
        const remainingOnlineAccountIds = Array.from(session.players.values())
            .filter(p => p.id !== departingAccountId && p.isOnline)
            .map(p => p.id);

        if (session.hostAccountId !== departingAccountId) {
            return { migrated: false, remainingOnlineAccountIds };
        }

        const candidate = Array.from(session.players.values())
            .find(p => p.id !== departingAccountId && p.isOnline);

        if (!candidate) {
            return { migrated: false, remainingOnlineAccountIds };
        }

        session.hostAccountId = candidate.id;

        return {
            migrated: true,
            newHostAccountId: session.hostAccountId,
            remainingOnlineAccountIds
        };
    }

    public handlePlayerDisconnect(sessionId: string, accountId: string): HostMigrationResult | null {
        const session = this.repo.get(sessionId);
        if (!session) return null;

        const player = session.getPlayer(accountId);
        if (!player) return null;

        player.isOnline = false;

        const migrationResult = this.migrateHostIfNeeded(session, accountId);

        const reconnectKey = `${sessionId}:${accountId}`;
        const timer = setTimeout(() => {
            this.reconnectTimers.delete(reconnectKey);
            this.finalizePlayerDeparture(sessionId, accountId);
        }, 120000);

        this.reconnectTimers.set(reconnectKey, timer);

        return migrationResult;
    }

    private finalizePlayerDeparture(sessionId: string, accountId: string): void {
        const session = this.repo.get(sessionId);
        if (!session) return;

        const isRestoredLobby = session.isRestoredSave && session.isLobby;

        if (isRestoredLobby) {
            const player = session.getPlayer(accountId);
            if (player) {
                player.isOnline = false;
            }
        } else {
            session.removePlayer(accountId);
            session.allowedAccountIds.delete(accountId);
        }

        if (this.accountSessionMap.get(accountId) === sessionId) {
            this.accountSessionMap.delete(accountId);
        }

        if (session.isEmpty() && !this.deleteTimers.has(sessionId)) {
            const timer = setTimeout(() => this.terminateSession(sessionId), 15000);
            this.deleteTimers.set(sessionId, timer);
        }
    }

    public tryReconnectPlayer(sessionId: string, accountId: string): boolean {
        const session = this.repo.get(sessionId);
        if (!session) return false;

        const reconnectKey = `${sessionId}:${accountId}`;
        const timer = this.reconnectTimers.get(reconnectKey);

        if (timer) {
            clearTimeout(timer);
            this.reconnectTimers.delete(reconnectKey);
        }

        const player = session.getPlayer(accountId);
        if (player) {
            player.isOnline = true;
            player.lastBroadcastedRoomX = null;
            player.lastBroadcastedRoomY = null;

            return true;
        }

        return false;
    }

    public leaveSession(sessionId: string, accountId: string): HostMigrationResult | null {
        const session = this.repo.get(sessionId);
        if (!session) return null;

        const isRestoredLobby = session.isRestoredSave && session.isLobby;

        if (isRestoredLobby) {
            const player = session.getPlayer(accountId);
            if (player) {
                player.isOnline = false;
            }
        } else {
            session.removePlayer(accountId);
            session.allowedAccountIds.delete(accountId);
        }

        this.accountSessionMap.delete(accountId);

        const migrationResult = this.migrateHostIfNeeded(session, accountId);

        if (session.isEmpty()) {
            if (!this.deleteTimers.has(sessionId)) {
                const GRACE_PERIOD_MS = 15000;

                const timer = setTimeout(() => {
                    this.terminateSession(sessionId);
                }, GRACE_PERIOD_MS);

                this.deleteTimers.set(sessionId, timer);
            }
        }

        return migrationResult;
    }
}