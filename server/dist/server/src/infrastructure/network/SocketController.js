"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketController = void 0;
const shared_1 = require("@game/shared");
class SocketController {
    socket;
    sessionUseCase;
    inputUseCase;
    login;
    constructor(socket, sessionUseCase, inputUseCase, login) {
        this.socket = socket;
        this.sessionUseCase = sessionUseCase;
        this.inputUseCase = inputUseCase;
        this.login = login;
        this.init();
    }
    init() {
        const userId = this.socket.id;
        this.socket.emit(shared_1.ServerEvent.PLAYER_ID, userId);
        this.socket.emit(shared_1.ServerEvent.CLASS_PRESETS, shared_1.PLAYER_CLASSES);
        this.socket.on(shared_1.ClientEvent.REQUEST_PROFILE, (callback) => {
            if (typeof callback === 'function') {
                callback({ success: true, login: this.login });
            }
        });
        this.socket.on(shared_1.ClientEvent.CREATE_SESSION, (rawData, callback) => {
            if (typeof callback !== 'function')
                return;
            const parsed = shared_1.SessionCreateRequestSchema.safeParse(rawData);
            if (!parsed.success) {
                return callback({ success: false, message: 'Неверные данные' });
            }
            try {
                const sessionId = this.sessionUseCase.createSession(userId, this.login, parsed.data.archetype, parsed.data.weaponId);
                this.socket.data.sessionId = sessionId;
                callback({ success: true, sessionId });
            }
            catch (err) {
                callback({ success: false, message: err.message });
            }
        });
        this.socket.on(shared_1.ClientEvent.CREATE_LOBBY, (rawData, callback) => {
            if (typeof callback !== 'function')
                return;
            const parsed = shared_1.SessionCreateRequestSchema.safeParse(rawData);
            if (!parsed.success) {
                return callback({ success: false, message: 'Неверные данные настройки лобби' });
            }
            try {
                const sessionId = this.sessionUseCase.createLobby(userId, this.login, parsed.data.archetype, parsed.data.weaponId);
                this.socket.data.sessionId = sessionId;
                callback({ success: true, sessionId });
            }
            catch (err) {
                callback({ success: false, message: err.message });
            }
        });
        this.socket.on(shared_1.ClientEvent.CONNECT_LOBBY, (rawData, callback) => {
            if (typeof callback !== 'function')
                return;
            const parsed = shared_1.SessionJoinRequestSchema.safeParse(rawData);
            if (!parsed.success) {
                return callback({ success: false, message: 'Неверные параметры подключения' });
            }
            const success = this.sessionUseCase.joinLobby(parsed.data.sessionId, userId, this.login, parsed.data.archetype, parsed.data.weaponId);
            if (success) {
                this.socket.data.sessionId = parsed.data.sessionId;
                callback({ success: true, sessionId: parsed.data.sessionId, message: "Вы вошли в лобби ожидания" });
            }
            else {
                callback({ success: false, message: 'Лобби не найдено или игра уже началась' });
            }
        });
        this.socket.on(shared_1.ClientEvent.START_GAME, () => {
            const sessionId = this.socket.data.sessionId;
            if (!sessionId)
                return;
            this.sessionUseCase.startMatch(sessionId, userId);
        });
        this.socket.on(shared_1.ClientEvent.PLAYER_ACTION, (rawData) => {
            const sessionId = this.socket.data.sessionId;
            if (!sessionId)
                return;
            const parsed = shared_1.PlayerActionSchema.safeParse(rawData);
            if (!parsed.success)
                return;
            this.inputUseCase.execute(sessionId, userId, parsed.data);
        });
        const handleLeave = () => {
            const sessionId = this.socket.data.sessionId;
            if (sessionId) {
                this.sessionUseCase.leaveSession(sessionId, userId);
                this.socket.data.sessionId = null;
            }
        };
        this.socket.on(shared_1.ClientEvent.LEAVE_SESSION, handleLeave);
        this.socket.on('disconnect', handleLeave);
    }
}
exports.SocketController = SocketController;
