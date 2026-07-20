import { Socket } from 'socket.io';
import {
    ClientEvent, ServerEvent, PLAYER_CLASSES,
    PlayerActionSchema, SessionCreateRequestSchema, SessionJoinRequestSchema,
} from '@game/shared';
import { SessionManagementUseCase } from '../../application/use-cases/SessionManagementUseCase';
import { ProcessInputUseCase } from '../../application/use-cases/ProcessInputUseCase';

export class SocketController {
    constructor(
        private socket: Socket,
        private sessionUseCase: SessionManagementUseCase,
        private inputUseCase: ProcessInputUseCase,
        private login: string
    ) {
        this.init();
    }

    private init(): void {
        const userId = this.socket.id;

        this.socket.emit(ServerEvent.PLAYER_ID, userId);
        this.socket.emit(ServerEvent.CLASS_PRESETS, PLAYER_CLASSES);

        this.socket.on(ClientEvent.REQUEST_PROFILE, (callback) => {
            if (typeof callback === 'function') {
                callback({ success: true, login: this.login });
            }
        });

        this.socket.on(ClientEvent.CREATE_SESSION, (rawData, callback) => {
            if (typeof callback !== 'function') return;

            const parsed = SessionCreateRequestSchema.safeParse(rawData);
            if (!parsed.success) {
                return callback({ success: false, message: 'Неверные данные' });
            }

            try {
                const sessionId = this.sessionUseCase.createSession(userId, this.login, parsed.data.archetype, parsed.data.weaponId);
                this.socket.data.sessionId = sessionId;
                callback({ success: true, sessionId });
            } catch (err: any) {
                callback({ success: false, message: err.message });
            }
        });

        this.socket.on(ClientEvent.CREATE_LOBBY, (rawData, callback) => {
            if (typeof callback !== 'function') return;

            const parsed = SessionCreateRequestSchema.safeParse(rawData);
            if (!parsed.success) {
                return callback({ success: false, message: 'Неверные данные настройки лобби' });
            }

            try {
                const sessionId = this.sessionUseCase.createLobby(userId, this.login, parsed.data.archetype, parsed.data.weaponId);
                this.socket.data.sessionId = sessionId;
                callback({ success: true, sessionId });
            } catch (err: any) {
                callback({ success: false, message: err.message });
            }
        });

        this.socket.on(ClientEvent.CONNECT_LOBBY, (rawData, callback) => {
            if (typeof callback !== 'function') return;

            const parsed = SessionJoinRequestSchema.safeParse(rawData);
            if (!parsed.success) {
                return callback({ success: false, message: 'Неверные параметры подключения' });
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
                this.sessionUseCase.leaveSession(sessionId, userId);
                this.socket.data.sessionId = null;
            }
        };

        this.socket.on(ClientEvent.LEAVE_SESSION, handleLeave);
        this.socket.on('disconnect', handleLeave);
    }
}