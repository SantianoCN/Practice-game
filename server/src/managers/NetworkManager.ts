import { Server, Socket } from 'socket.io';
import { randomUUID } from 'crypto';
import { LoginData, PlayerAction, SessionJoinRequest, SessionConnectResponse, SessionCreateRequest, SessionLeaveRequest, SessionCreateResponse } from '../../../shared/gameTypes';
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
        this.io.on('connection', (socket: Socket) => this.connectUserHandler(socket));
        console.log('initialized');
    }

    private broadcastSnapshot(snapshot: any) {
        this.io.emit('game:snapshot', snapshot);
    }

    public async connectUserHandler(socket: Socket) {
        console.log('соединение установлено');
        
        // авторизация подключения
        socket.once('login', (data: LoginData) => this.authorizeConnection(socket, data));
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
            (request: SessionLeaveRequest) =>
                this.leaveSession(request, socket) 
        );
        socket.on(
            'playerAction', (data: PlayerAction) => 
                this.playerActionHandler(data, socket)
        );

        //socket.emit('response', { success: true, userId: 'userId'});
        socket.emit('response', { success: true, userId: IdGenerator.generateUUID('player')});
    }

    public async createSessionHandler(request: SessionCreateRequest, socket: Socket) {
        const sessionId = this.game.createSession();
        this.game.addPlayer(
            sessionId, 
            request.userId, 
            request.name,
            request.archetype,
            (snapshot: any) => {
                const response: SessionCreateResponse = {
                    sessionId: sessionId
                };
                socket.emit('connect-session-response', response);
            }
        )
    }

    public joinSessionHandler(request: SessionJoinRequest, socket: Socket) {
        if (!request.sessionId || 
            !this.game.sessionExists(request.sessionId)) {
                socket.emit('error', { message: 'не удается найти сессию' });
                return;
        }
        this.game.addPlayer(
            request.sessionId, 
            request.userId, 
            request.name,
            request.archetype,
            (snapshot: any) => {
                const response: SessionConnectResponse = {
                    success: true,
                    sessionId: request.sessionId,
                    snapshot: snapshot
                };
                socket.emit('connect-session-response', response);
            }
        )
    }

    public playerActionHandler(
        data: PlayerAction,
        socket: Socket
    ) {
        if (!data.sessionId || !data.userId) return;
        this.game.pushInput(
            data.sessionId, 
            data.userId, 
            data
        );
    }

    public leaveSession(
        request: SessionLeaveRequest, 
        socket: Socket
    ) {
        if (!request.sessionId || !request.userId) return;
        this.game.removePlayer(
            request.sessionId, 
            request.userId
        );
    }

    public disconnectSocket(socket: Socket) {
        socket.disconnect();
    }
} 