import { Server, Socket } from 'socket.io';
import { randomUUID } from 'crypto';
import { LoginData } from '../models/LoginData';
import { PlayerAction } from 'src/models/PlayerAction';

export class NetworkManager {
    private io: Server;
    //private accountService: AccountService;

    constructor(io: Server) {
        this.io = io;
    }

    public init() {
        this.io.on('connection', (socket) => this.connectUserHandler(socket));
        console.log('initialized');
    }

    public async connectUserHandler(socket: Socket) {
        console.log('соединение установлено');
        socket.on('login', (data) => this.authorizeConnection(socket, data));
        socket.on('playerAction', (data) => this.playerActionHandler(socket, data) );
    }
    
    public async authorizeConnection(socket: Socket, data: LoginData) {
        if (!data.login || !data.password) {
            console.log(data);
            socket.emit('response', { success: false, message: 'wrong data' } );
            this.disconnectSocket(socket);
            return;
        }

        // const response = await accountService.login(data)
        // if (!response) {
        //     socket.emit('response', { success: false, message: 'incorrect login or password' } );
        //     this.close();
        //     return;
        // }

        const userId = randomUUID();
        // await accountService.saveId(userId);
        socket.emit('response', { success: true, user_id: userId});
    }

    public async playerActionHandler(socket: Socket, data: PlayerAction) {
        // TODO: связать с GameManager
    }

    public disconnectSocket(socket: Socket) {
        socket.disconnect();
    }
} 