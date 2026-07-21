import { Socket, Server } from 'socket.io';
import {
    ClientEvent, ServerEvent, PLAYER_CLASSES, PlayerProgressDTO, BuyItemRequestSchema,
    PlayerActionSchema, SessionCreateRequestSchema, SessionJoinRequestSchema,
} from '@game/shared';
import { SessionManagementUseCase } from '../../application/use-cases/SessionManagementUseCase';
import { ProcessInputUseCase } from '../../application/use-cases/ProcessInputUseCase';
import { IAccountRepository } from '../../application/interfaces/IAccountRepository';
import { BuyItemUseCase } from '../../application/use-cases/BuyItemUseCase';
import { CompleteSessionUseCase } from '../../application/use-cases/CompleteSessionUseCase';

export class SocketController {
    constructor(
        private io: Server,
        private socket: Socket,
        private sessionUseCase: SessionManagementUseCase,
        private inputUseCase: ProcessInputUseCase,
        private accountRepo: IAccountRepository,
        private buyItemUseCase: BuyItemUseCase,
        private completeSessionUseCase: CompleteSessionUseCase,
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

            // Отправляем синхронизацию строго по константе SYNC_PROGRESS
            this.socket.emit(ServerEvent.SYNC_PROGRESS, progressDTO);
        } catch (err) {
            console.error(`[Sync Progress Error] Ошибка синхронизации для ${this.login}:`, err);
        }
    }

    private init(): void {
        const userId = this.socket.id;

        this.socket.emit(ServerEvent.PLAYER_ID, userId);
        this.socket.emit(ServerEvent.CLASS_PRESETS, PLAYER_CLASSES);

        this.syncProgress();

        this.socket.on(ClientEvent.REQUEST_PROFILE, async (callback) => {
            if (typeof callback === 'function') {
                try {
                    const account = await this.accountRepo.getByLogin(this.login);
                    const progressDTO: PlayerProgressDTO | undefined = account?.progress ? {
                        metaGold: account.progress.metaGold,
                        unlockedClasses: account.progress.unlockedClasses,
                        unlockedWeapons: account.progress.unlockedWeapons
                    } : undefined;

                    callback({ 
                        success: true, 
                        login: this.login,
                        progress: progressDTO
                    });
                } catch (err) {
                    callback({ success: false, message: 'Ошибка загрузки профиля' });
                }
            }
        });

        // Слушаем покупку строго по константе BUY_ITEM
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

        // Успешное завершение похода с сохранением золота (по константе COMPLETE_SESSION)
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

                            // Теперь и одиночный игрок, и все члены отряда гарантированно получат это сетевое событие!
                            this.io.to(p.id).emit(ServerEvent.SESSION_COMPLETED, {
                                message: 'Поход успешно завершен! Золото сохранено в избе.',
                                progress: progressDTO
                            });
                        }
                    }

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
                callback({ success: false, message: 'Лобби не найдено или игра уже началась' });
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

        const handleLeave = () => {
            const sessionId = this.socket.data.sessionId;
            if (sessionId) {
                const session = this.sessionUseCase.getSession(sessionId);
                
                if (session && session.hostId === userId) {
                    const players = Array.from(session.players.values());
                    for (const p of players) {
                        if (p.id !== userId) {
                            // Оповещаем о прекращении сессии по константе SESSION_TERMINATED
                            this.io.to(p.id).emit(ServerEvent.SESSION_TERMINATED, {
                                message: 'Воевода (хост) покинул поход. Сессия закрыта.'
                            });
                        }
                    }
                    this.sessionUseCase.terminateSession(sessionId);
                } else {
                    this.sessionUseCase.leaveSession(sessionId, userId);
                }
                this.socket.data.sessionId = null;
            }
        };

        this.socket.on(ClientEvent.LEAVE_SESSION, handleLeave);
        this.socket.on('disconnect', handleLeave);
    }
}