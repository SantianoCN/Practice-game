import { Socket, Server } from 'socket.io';
import {
    ClientEvent, ServerEvent, PLAYER_CLASSES, PlayerProgressDTO, BuyItemRequestSchema,
    PlayerActionSchema, SessionCreateRequestSchema, SessionJoinRequestSchema
} from '@game/shared';
import { SessionManagementUseCase } from '../../application/use-cases/SessionManagementUseCase';
import { ProcessInputUseCase } from '../../application/use-cases/ProcessInputUseCase';
import { IAccountRepository } from '../../application/interfaces/IAccountRepository';
import { BuyItemUseCase } from '../../application/use-cases/BuyItemUseCase';
import { CompleteSessionUseCase } from '../../application/use-cases/CompleteSessionUseCase';
import { SaveSessionUseCase } from '../../application/use-cases/SaveSessionUseCase';
import { ISaveRepository } from '../../application/interfaces/ISaveRepository';
import { NextFloorUseCase } from '../../application/use-cases/NextFloorUseCase';

export class SocketController {
    constructor(
        private io: Server,
        private socket: Socket,
        private sessionUseCase: SessionManagementUseCase,
        private inputUseCase: ProcessInputUseCase,
        private accountRepo: IAccountRepository,
        private buyItemUseCase: BuyItemUseCase,
        private completeSessionUseCase: CompleteSessionUseCase,
        private saveSessionUseCase: SaveSessionUseCase,
        private nextFloorUseCase: NextFloorUseCase,
        private saveRepo: ISaveRepository,
        private login: string
    ) {
        this.init();
    }

    public async syncProgress(): Promise<void> {
        try {
            const account = await this.accountRepo.getByLogin(this.login);
            if (!account || !account.progress) return;

            const progressDTO: PlayerProgressDTO = {
                metaGold: account.progress.metaGold,
                unlockedClasses: account.progress.unlockedClasses,
                unlockedWeapons: account.progress.unlockedWeapons
            };

            this.socket.emit(ServerEvent.SYNC_PROGRESS, progressDTO);
        } catch (err) {
            console.error(`[Sync Progress Error] Ошибка синхронизации для ${this.login}:`, err);
        }
    }

    private async init(): Promise<void> {
        const userId = this.socket.id;

        this.socket.on(ClientEvent.REQUEST_PROFILE, async (callback) => {
            if (typeof callback !== 'function') return;
            try {
                const account = await this.accountRepo.getByLogin(this.login);
                const progressDTO: PlayerProgressDTO | undefined = account?.progress ? {
                    metaGold: account.progress.metaGold,
                    unlockedClasses: account.progress.unlockedClasses,
                    unlockedWeapons: account.progress.unlockedWeapons
                } : undefined;

                const save = await this.saveRepo.getRunSaveByHost(this.login);

                const currentSessionId: string | null = this.socket.data.sessionId || null;
                let isHost = false;
                if (currentSessionId) {
                    const currentSession = this.sessionUseCase.getSession(currentSessionId);
                    if (currentSession) isHost = currentSession.hostId === userId;
                }

                callback({
                    success: true,
                    login: this.login,
                    progress: progressDTO,
                    activeSaveSessionId: save?.sessionId || null,
                    currentSessionId,
                    isHost
                });
            } catch (err) {
                console.error('[REQUEST_PROFILE] Ошибка на сервере:', err);
                
                callback({ success: false, message: 'Ошибка загрузки профиля' });
            }
        });

        this.socket.on(ClientEvent.RESTORE_SAVE, async (rawData, callback) => {
            if (typeof callback !== 'function') return;
            const save = await this.saveRepo.getRunSaveByHost(this.login);
            if (!save) {
                return callback({ success: false, message: 'Сохранение не найдено' });
            }

            try {
                const sessionId = await this.sessionUseCase.loadRestoredLobby(save.sessionId, userId, this.login);
                if (sessionId) {
                    this.socket.data.sessionId = sessionId;
                    callback({ success: true, sessionId });
                } else {
                    callback({ success: false, message: 'Не удалось воссоздать лобби' });
                }
            } catch (err: any) {
                callback({ success: false, message: err.message });
            }
        });

        this.socket.on(ClientEvent.BUY_ITEM, async (rawData, callback) => {
            if (typeof callback !== 'function') return;

            const parsed = BuyItemRequestSchema.safeParse(rawData);
            if (!parsed.success) {
                return callback({ success: false, message: 'Неверные параметры покупки' });
            }

            try {
                const updatedProgress = await this.buyItemUseCase.execute(this.login, parsed.data.itemPresetId);

                if (updatedProgress) {
                    callback({
                        success: true,
                        progress: {
                            metaGold: updatedProgress.metaGold,
                            unlockedClasses: updatedProgress.unlockedClasses,
                            unlockedWeapons: updatedProgress.unlockedWeapons
                        }
                    });
                } else {
                    callback({ success: false, message: 'Недостаточно золота или предмет уже разблокирован' });
                }
            } catch (err) {
                callback({ success: false, message: 'Ошибка при проведении покупки' });
            }
        });

        this.socket.on(ClientEvent.SAVE_AND_EXIT, async (rawData, callback) => {
            if (typeof callback !== 'function') return;
            const sessionId = this.socket.data.sessionId;
            if (!sessionId) return callback({ success: false, message: 'Сессия не найдена' });

            const session = this.sessionUseCase.getSession(sessionId);
            if (!session) return callback({ success: false, message: 'Сессия не найдена' });

            if (session.hostId !== userId) {
                return callback({ success: false, message: 'Только воевода (хост) может сохранить поход!' });
            }

            try {
                await this.saveSessionUseCase.execute(sessionId);
                this.sessionUseCase.terminateSessionWithNotification(
                    sessionId,
                    'Поход сохранен воеводой. Возврат в избу.',
                    this.io
                );
                callback({ success: true });
            } catch (err) {
                callback({ success: false, message: 'Не удалось сохранить поход' });
            }
        });

        this.socket.on(ClientEvent.NEXT_FLOOR, () => {
            const sessionId = this.socket.data.sessionId;
            if (!sessionId) return;

            const session = this.sessionUseCase.getSession(sessionId);
            if (!session || session.hostId !== userId) return;

            const hostPlayer = session.getPlayer(userId);
            if (!hostPlayer) return;

            const room = session.getRoom(hostPlayer.roomX, hostPlayer.roomY);
            if (room && room.type === 'Boss' && room.portal && room.portal.isActive) {
                this.nextFloorUseCase.execute(sessionId);
            }
        });

        this.socket.on(ClientEvent.COMPLETE_SESSION, async (rawData, callback) => {
            if (typeof callback !== 'function') return;

            const sessionId = this.socket.data.sessionId;
            if (!sessionId) {
                return callback({ success: false, message: 'Сессия не найдена' });
            }

            const session = this.sessionUseCase.getSession(sessionId);
            if (!session) {
                return callback({ success: false, message: 'Сессия не найдена' });
            }

            const isHost = session.hostId === userId;

            try {
                if (isHost) {
                    const players = Array.from(session.players.values());

                    for (const p of players) {
                        const updatedProgress = await this.completeSessionUseCase.execute(sessionId, p.id, p.name);

                        if (updatedProgress) {
                            const progressDTO: PlayerProgressDTO = {
                                metaGold: updatedProgress.metaGold,
                                unlockedClasses: updatedProgress.unlockedClasses,
                                unlockedWeapons: updatedProgress.unlockedWeapons
                            };

                            this.io.to(p.id).emit(ServerEvent.SESSION_COMPLETED, {
                                message: 'Поход успешно завершен! Золото сохранено в избе.',
                                progress: progressDTO
                            });
                        }
                    }

                    await this.saveRepo.deleteRun(sessionId);
                    this.sessionUseCase.terminateSession(sessionId);
                    callback({ success: true });
                } else {
                    callback({ success: false, message: 'Только воевода (хост) может завершить поход отряда!' });
                }
            } catch (err) {
                callback({ success: false, message: 'Ошибка при завершении забега' });
            }
        });

        this.socket.on(ClientEvent.CREATE_SESSION, async (rawData, callback) => {
            if (typeof callback !== 'function') return;

            const parsed = SessionCreateRequestSchema.safeParse(rawData);
            if (!parsed.success) {
                return callback({ success: false, message: 'Неверные данные' });
            }

            const account = await this.accountRepo.getByLogin(this.login);
            if (!account || !account.progress) {
                return callback({ success: false, message: 'Ошибка авторизации аккаунта' });
            }

            const isClassUnlocked = account.progress.unlockedClasses.includes(parsed.data.archetype);
            const isWeaponUnlocked = account.progress.unlockedWeapons.includes(parsed.data.weaponId);

            if (!isClassUnlocked || !isWeaponUnlocked) {
                this.syncProgress();
                return callback({ success: false, message: 'Выбранный класс или оружие еще не разблокированы!' });
            }

            try {
                const sessionId = this.sessionUseCase.createSession(userId, this.login, parsed.data.archetype, parsed.data.weaponId);
                this.socket.data.sessionId = sessionId;
                callback({ success: true, sessionId });
            } catch (err: any) {
                callback({ success: false, message: err.message });
            }
        });

        this.socket.on(ClientEvent.CREATE_LOBBY, async (rawData, callback) => {
            if (typeof callback !== 'function') return;

            const parsed = SessionCreateRequestSchema.safeParse(rawData);
            if (!parsed.success) {
                return callback({ success: false, message: 'Неверные данные настройки лобби' });
            }

            const account = await this.accountRepo.getByLogin(this.login);
            if (!account || !account.progress) {
                return callback({ success: false, message: 'Ошибка авторизации аккаунта' });
            }

            const isClassUnlocked = account.progress.unlockedClasses.includes(parsed.data.archetype);
            const isWeaponUnlocked = account.progress.unlockedWeapons.includes(parsed.data.weaponId);

            if (!isClassUnlocked || !isWeaponUnlocked) {
                this.syncProgress();
                return callback({ success: false, message: 'Выбранный класс или оружие еще не разблокированы!' });
            }

            try {
                const sessionId = this.sessionUseCase.createLobby(userId, this.login, parsed.data.archetype, parsed.data.weaponId);
                this.socket.data.sessionId = sessionId;
                callback({ success: true, sessionId });
            } catch (err: any) {
                callback({ success: false, message: err.message });
            }
        });

        this.socket.on(ClientEvent.CONNECT_LOBBY, async (rawData, callback) => {
            if (typeof callback !== 'function') return;

            const parsed = SessionJoinRequestSchema.safeParse(rawData);
            if (!parsed.success) {
                return callback({ success: false, message: 'Неверные параметры подключения' });
            }

            const account = await this.accountRepo.getByLogin(this.login);
            if (!account || !account.progress) {
                return callback({ success: false, message: 'Ошибка авторизации аккаунта' });
            }

            const isClassUnlocked = account.progress.unlockedClasses.includes(parsed.data.archetype);
            const isWeaponUnlocked = account.progress.unlockedWeapons.includes(parsed.data.weaponId);

            if (!isClassUnlocked || !isWeaponUnlocked) {
                this.syncProgress();
                return callback({ success: false, message: 'Выбранный класс или оружие еще не разблокированы!' });
            }

            const success = this.sessionUseCase.joinLobby(parsed.data.sessionId, userId, this.login, parsed.data.archetype, parsed.data.weaponId);

            if (success) {
                this.socket.data.sessionId = parsed.data.sessionId;
                callback({ success: true, sessionId: parsed.data.sessionId, message: "Вы вошли в лобби ожидания" });
            } else {
                callback({ success: false, message: 'Вы не участвуете в этом походе или игра уже началась' });
            }
        });

        this.socket.on(ClientEvent.START_GAME, () => {
            const sessionId = this.socket.data.sessionId;
            if (!sessionId) return;
            this.sessionUseCase.startMatch(sessionId, userId);
        });

        this.socket.on(ClientEvent.PLAYER_ACTION, (rawData) => {
            const sessionId = this.socket.data.sessionId;
            if (!sessionId) return;

            const parsed = PlayerActionSchema.safeParse(rawData);
            if (!parsed.success) return;

            this.inputUseCase.execute(sessionId, userId, parsed.data);
        });

        this.socket.on(ClientEvent.LEAVE_SESSION, () => {
            const sessionId = this.socket.data.sessionId;
            if (!sessionId) return;

            console.log(`[Leave Game] Игрок ${this.login} добровольно покинул отряд.`);
            const result = this.sessionUseCase.leaveSession(sessionId, userId, this.login);
            this.socket.data.sessionId = null;

            if (!result) return;

            if (result.migrated) {
                for (const id of result.remainingOnlineIds) {
                    this.io.to(id).emit(ServerEvent.ERROR, `Воевода ${this.login} покинул отряд. Новым лидером назначен ${result.newHostLogin}`);
                }
            } else {
                for (const id of result.remainingOnlineIds) {
                    this.io.to(id).emit(ServerEvent.ERROR, `Игрок ${this.login} покинул отряд.`);
                }
            }
        });

        this.socket.on('disconnect', () => {
            const sessionId = this.socket.data.sessionId;
            if (!sessionId) return;

            const result = this.sessionUseCase.handlePlayerDisconnect(sessionId, userId, this.login);
            if (result?.migrated) {
                for (const id of result.remainingOnlineIds) {
                    this.io.to(id).emit(ServerEvent.ERROR, `Связь с воеводой ${this.login} потеряна. Новым лидером назначен ${result.newHostLogin}`);
                }
            }
        });

        this.socket.emit(ServerEvent.PLAYER_ID, userId);
        this.socket.emit(ServerEvent.CLASS_PRESETS, PLAYER_CLASSES);
        this.syncProgress();

        const cachedSessionId = this.sessionUseCase.findActiveSessionByLogin(this.login);
        if (cachedSessionId) {
            const wasRestored = this.sessionUseCase.tryReconnectPlayer(cachedSessionId, userId, this.login);
            if (wasRestored) {
                this.socket.data.sessionId = cachedSessionId;
            }
        }
    }
}