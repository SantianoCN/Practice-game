import { Server, Socket} from 'socket.io';
import { LoginData, PlayerAction, SessionJoinRequest, SessionCreateRequest, GameSnapshot } from '../../../../shared/gameTypes';
import GameManager from '../../application/managers/GameManager';
import { AccountManager } from '../../application/managers/AccountManager';
import { ClientEvent, ServerEvent } from '../../../../shared/networkEvents';

export class NetworkServer {
    private io: Server;
    private game: GameManager;
    private accountManager: AccountManager;

    constructor(
        io: Server,
        gameManager: GameManager,
        accountManager: AccountManager
    ) {
        this.io = io;
        this.game = gameManager;
        this.accountManager = accountManager;
    }

    public init() {
        this.io.use((socket, next) => this.authenticationMiddleware(socket, next))
        this.io.on('connection', 
            (socket: Socket) => 
                this.connectUserHandler(socket)
        );
        console.log('[NetworkManager] initialized');
    }

    private async authenticationMiddleware(socket: Socket, next: (err?: Error) => void) {
        const token = socket.handshake.auth.token;
        console.log(token);
        if (!token || typeof token !== 'string') {
            console.log('[NetworkManager][authenticationMiddleware] auth: токен авторизации не обнаружен');
            next(
                new Error('auth: токен авторизации не обнаружен')
            );
            return;
        }
        const login = (await this.accountManager.resolveToken(token))?.login;
        if (!login) {
            console.log('[authenticationMiddleware] auth: токен авторизации не обнаружен');
            next(
                new Error('auth: токен авторизации не обнаружен')
            );
            return;
        }
        socket.data.login = login;
        next();
    }

    public connectUserHandler(socket: Socket) {
        console.log('[NetworkManager] соединение установлено:', socket.id);
        
        socket.on(ClientEvent.CREATE_SESSION,
            (request: SessionCreateRequest) =>
                this.createSessionHandler(request, socket)
        );
        socket.on(ClientEvent.CONNECT_SESSION,
            (request: SessionJoinRequest) => 
                this.joinSessionHandler(request, socket)
        );
        socket.on(ClientEvent.LEAVE_SESSION,
            () => this.leaveSession(socket)
        );
        socket.on(
            'playerAction', (data: PlayerAction) => 
                this.playerActionHandler(data, socket)
        );
        socket.on('disconnect', () => 
            this.disconnectHandler(socket)
        );

        socket.data.userId = socket.data.login;
    }

    public createSessionHandler(request: SessionCreateRequest, socket: Socket) {
        if (!socket.data.userId) {
            socket.emit(ServerEvent.SESSION_CREATE_RESPONSE,
                { success: false, message: 'пользователь не авторизован' }
            );
            return;
        } 
        const sessionId = this.game.createSession();
        socket.data.sessionId = sessionId;
        const state = this.game.addPlayer(
            sessionId, 
            socket.data.userId, 
            request.name,
            request.archetype,
            (snapshot: GameSnapshot) => {
                socket.emit(ServerEvent.SNAPSHOT, snapshot);
            }
        );
        if (!state.success) {
            this.game.removeSession(sessionId);
            socket.emit(ServerEvent.SESSION_CREATE_RESPONSE,
                { success: false, message: state.message }
            );
            return;
        }
        socket.emit(ServerEvent.SESSION_CREATE_RESPONSE, 
            { success: true, sessionId: sessionId }
        );
    }

    public joinSessionHandler(request: SessionJoinRequest, socket: Socket) {
        if (!socket.data.userId) {
             socket.emit(ServerEvent.SESSION_JOIN_RESPONSE, 
                { success: false, message: 'пользователь не авторизован' }
            );
            return;
        } 
        if (!this.game.sessionExists(request.sessionId)) {
            socket.emit(ServerEvent.SESSION_JOIN_RESPONSE, 
                { success: false, sessionId: '', message:  'такой сессии не существует' }
            );
            return;
        }
        const state = this.game.addPlayer(
            request.sessionId, 
            socket.data.userId,
            request.name,
            request.archetype,
            (snapshot: GameSnapshot) => {
                socket.emit(ServerEvent.SNAPSHOT, snapshot); 
            }
        );
        if (!state.success) {
            socket.emit(ServerEvent.SESSION_JOIN_RESPONSE,
                { success: false, message: state.message }
            );
            return;
        }
        socket.data.sessionId = request.sessionId;
        socket.emit(ServerEvent.SESSION_JOIN_RESPONSE,
            { success: true, sessionId: request.sessionId, message: "успешное подключение" }
        );
    }

    public playerActionHandler(
        data: PlayerAction,
        socket: Socket
    ) {
        if (!socket.data.sessionId || !socket.data.userId) return;
        this.game.pushInput(
            socket.data.sessionId,
            socket.data.userId,
            data
        );
    }

    public leaveSession(socket: Socket) {
        if (!socket.data.sessionId || !socket.data.userId) return;
        this.game.removePlayer(socket.data.sessionId, socket.data.userId);
        socket.data.sessionId = undefined;
    }

    private disconnectHandler(socket: Socket) {
        const { userId, sessionId } = socket.data;
        if (userId && sessionId) {
            this.game.removePlayer(sessionId, userId);
        }
        console.log('[NetworkManager] соединение разорвано:', socket.id);
    }

    public disconnectSocket(socket: Socket) {
        socket.disconnect();
    }
}