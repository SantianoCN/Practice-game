import { Server, Socket } from 'socket.io';
import { randomUUID } from 'crypto';
import { LoginData, PlayerAction, SessionJoinRequest, SessionCreateRequest, GameSnapshot } from '../../../shared/gameTypes';
import GameManager from './GameManager';
import IdGenerator from '../utils/IDGenerator';

export class NetworkManager {
    private io: Server;
    private game: GameManager;
    //private accountService: AccountManager;

    constructor(io: Server, gameManager: GameManager) {
        this.io = io;
        this.game = gameManager;
    }

    public init() {
        this.io.on('connection', 
            (socket: Socket) => 
                this.connectUserHandler(socket)
        );
        console.log('initialized');
    }

    public connectUserHandler(socket: Socket) {
        console.log('соединение установлено');
        
        // авторизация подключения
        socket.once('login', 
            (data: LoginData) => 
                this.authorizeConnection(socket, data)
        );
        // отключение сокета
        socket.on('disconnect',
            () => {
                this.disconnectHandler(socket)
            }
        )
    }
    
    public async authorizeConnection(socket: Socket, data: LoginData) {
        if (!data.login || !data.password) {
            console.log(data);
            socket.emit('response', { success: false, message: 'wrong data' } );
            this.disconnectSocket(socket);
            return;
        }

        // const userId = await accountService.login(data)
        // if (!userId) {
        //     socket.emit('response', { success: false, message: 'incorrect login or password' } );
        //     this.close();
        //     return;
        // }
        //
        //await accountService.saveId(userId);
        
        // создание/подключение к игровой сессии
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

        //socket.emit('response', { success: true, userId: 'userId'});
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
                socket.emit('error', 
                    { message: 'не удается найти сессию' }
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