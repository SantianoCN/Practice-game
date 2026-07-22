import { Socket, Server } from 'socket.io';
import {
    ClientEvent, ServerEvent, PLAYER_CLASSES, PlayerProgressDTO, BuyItemRequestSchema,
    PlayerActionSchema, SessionCreateRequestSchema, SessionJoinRequestSchema, GAME_CONFIG
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

        this.socket.emit(ServerEvent.PLAYER_ID, userId);
        this.socket.emit(ServerEvent.CLASS_PRESETS, PLAYER_CLASSES);

        this.syncProgress();

        const activeSaves = await this.saveRepo.getRunSaveByHost(this.login);
        if (activeSaves) {
            const wasRestored = this.sessionUseCase.tryReconnectPlayer(activeSaves.sessionId, userId, this.login);
            if (wasRestored) {
                this.socket.data.sessionId = activeSaves.sessionId;
            }
        }

        this.socket.on(ClientEvent.REQUEST_PROFILE, async (callback) => {
            if (typeof callback === 'function') {
                try {
                    const account = await this.accountRepo.getByLogin(this.login);
                    const progressDTO: PlayerProgressDTO | undefined = account?.progress ? {
                        metaGold: account.progress.metaGold,
                        unlockedClasses: account.progress.unlockedClasses,
                        unlockedWeapons: account.progress.unlockedWeapons
                    } : undefined;

                    // Возвращаем также информацию об активном сохранении, если оно есть
                    const save = await this.saveRepo.getRunSaveByHost(this.login);

                    callback({ 
                        success: true, 
                        login: this.login,
                        progress: progressDTO,
                        activeSaveSessionId: save?.sessionId || null
                    });
                } catch (err) {
                    callback({ success: false, message: 'Ошибка загрузки профиля' });
                }
            }
        });

        this.socket.on(ClientEvent.RESTORE_SAVE, async (rawData, callback) => {
            if (typeof callback !== 'function') return;
            const save = await this.saveRepo.getRunSaveByHost(this.login);
            if (!save) {
                return callback({ success: false, message: 'Сохранение не найдено' });
            }

            try {
                const sessionId = await this.sessionUseCase.loadRestoredLobby(save.sessionId);
                if (sessionId) {
                    const session = this.sessionUseCase.getSession(sessionId);
                    
                    if (session) {
                        // Находим персонаж хоста по его логину
                        const hostPlayer = Array.from(session.players.values()).find(p => p.name === this.login);
                        
                        if (hostPlayer) {
                            // Удаляем старый оффлайн-id из мапы сессии
                            session.removePlayer(hostPlayer.id);
                            
                            // Связываем с актуальным Socket ID хоста и переводим в онлайн
                            hostPlayer.id = userId;
                            hostPlayer.isOnline = true;

                            // Сбрасываем координаты хоста строго на центр временной комнаты лобби
                            hostPlayer.roomX = Math.floor(GAME_CONFIG.MAP_SIZE / 2);
                            hostPlayer.roomY = Math.floor(GAME_CONFIG.MAP_SIZE / 2);
                            hostPlayer.x = session.roomWidth / 2;
                            hostPlayer.y = session.roomHeight / 2;
                            hostPlayer.vx = 0;
                            hostPlayer.vy = 0;
                            hostPlayer.lastBroadcastedRoomX = null;
                            hostPlayer.lastBroadcastedRoomY = null;

                            // Добавляем обновленного хоста обратно в сессию
                            session.addPlayer(hostPlayer);

                            // Назначаем права лидера на активный сокет хоста
                            session.hostId = userId;
                            session.hostLogin = this.login;
                        }
                    }

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

            // Валидируем на сервере, что хост действительно стоит у активного портала
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

                    // При успешном завершении забега стираем старые сохранения
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

        // --- ДОБРОВОЛЬНЫЙ ВЫХОД / АГРЕССИВНОЕ ЗАКРЫТИЕ СЕССИИ ---
        const handleLeave = () => {
            const sessionId = this.socket.data.sessionId;
            if (sessionId) {
                const session = this.sessionUseCase.getSession(sessionId);
                if (session) {
                    // Жесткое правило нашей игры: если кто-то сознательно жмет "Выйти", 
                    // сессия прекращается у всей группы
                    this.sessionUseCase.terminateSessionWithNotification(
                        sessionId, 
                        `Игрок ${this.login} покинул отряд. Сессия закрыта. Накопленное за уровень золото сгорело.`, 
                        this.io
                    );
                }
                this.socket.data.sessionId = null;
            }
        };

        this.socket.on(ClientEvent.LEAVE_SESSION, handleLeave);
        
        // Потеря связи — запускаем таймер на 120 секунд в SessionManagement
        this.socket.on('disconnect', () => {
            const sessionId = this.socket.data.sessionId;
            if (sessionId) {
                this.sessionUseCase.handlePlayerDisconnect(sessionId, userId, this.login);
            }
        });
    }
}