import { Server, Socket } from 'socket.io';
import { randomUUID } from 'crypto';
import { LoginData, PlayerAction, SessionJoinRequest, SessionCreateRequest, GameSnapshot } from '../../../shared/gameTypes';
import GameManager from './GameManager';
import { IdGenerator } from '../utils/IDGenerator';
import { AccountManager } from './AccountManager';

export class NetworkManager {
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
        console.log('initialized');
    }

    private authenticationMiddleware(socket: Socket, next: (err?: Error) => void) {
        const token = socket.handshake.auth.token;
        
        if (!token || typeof token !== 'string') {
            console.log('[authenticationMiddleware] auth: токен авторизации не обнаружен');
            next(
                new Error('auth: токен авторизации не обнаружен')
            );
            return;
        }

        const login = this.accountManager.resolveToken(token); 
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
        console.log('соединение установлено');
        
        socket.on('create-session',
            (request: SessionCreateRequest) =>
                this.createSessionHandler(request, socket)
        );
        socket.on('connect-session',
            (request: SessionJoinRequest) => 
                this.joinSessionHandler(request, socket)
        );
        socket.on('leave-session',
            () =>
                this.leaveSession(socket) 
        );
        socket.on(
            'playerAction', (data: PlayerAction) => 
                this.playerActionHandler(data, socket)
        );
        socket.on('disconnect', () => 
            this.disconnectHandler(socket)
        ); 

        socket.data.userId = IdGenerator.generateUUID('player');
        socket.emit('response', { success: true });
    }

    public createSessionHandler(request: SessionCreateRequest, socket: Socket) {
        if (!socket.data.userId) return;
        const sessionId = this.game.createSession();
        socket.data.sessionId = sessionId;
        this.game.addPlayer(
            sessionId, 
            socket.data.userId, 
            request.name,
            request.archetype,
            (snapshot: GameSnapshot) => {
                socket.emit('snapshot', snapshot);
            }
        );
        socket.emit('session-create-response', 
            { success: true, sessionId: sessionId }
        );
    }

    public joinSessionHandler(request: SessionJoinRequest, socket: Socket) {
        if (!socket.data.userId) return;
        if (!this.game.sessionExists(request.sessionId)) {
                socket.emit('session-join-response', 
                    { success: false, sessionId: '' }
                );
                return;
        }
        this.game.addPlayer(
            request.sessionId, 
            socket.data.userId,
            request.name,
            request.archetype,
            (snapshot: GameSnapshot) => {
                socket.emit('snapshot', snapshot); 
            }
        )
        socket.data.sessionId = request.sessionId;
        socket.emit('session-join-response',
            { success: true, sessionId: request.sessionId }
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

    public leaveSession( 
        socket: Socket
    ) {
        if (!socket.data.sessionId || !socket.data.userId) return;
        this.game.removePlayer(
            socket.data.sessionId, 
            socket.data.userId
        );
        socket.data.sessionId = undefined;
    }

    private disconnectHandler(socket: Socket) {
        const { userId, sessionId } = socket.data;
        if (userId && sessionId) {
            this.game.removePlayer(sessionId, userId);
        }
        console.log('соединение разорвано:', socket.id);
    }

    public disconnectSocket(socket: Socket) {
        socket.disconnect();
    }
}