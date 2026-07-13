import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { NetworkManager } from './src/managers/NetworkManager';
import GameManager from './src/managers/GameManager';
import { AccountManager } from './src/managers/AccountManager';
import { LoginData, LoginResponse, LogoutRequest, LogoutResponse } from '../shared/gameTypes';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());
const httpServer = createServer(app);
const accountManager = new AccountManager();

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

app.post('/register', (req: Request<{}, {}, LoginData>, res: Response<LoginResponse>) => {
    const token = accountManager.register(req.body);
    if (token === null) {
        res.send({
            success: false,
            message: 'пользователь уже существует'
        });
        return;
    }
    res.send({
        success: true,
        refreshToken: token!,
        message: 'пользователь зарегистрирован'
    });
});

app.post('/login', (req: Request<{}, {}, LoginData>, res: Response<LoginResponse>) => {
    const token = accountManager.login(req.body);
    if (token === null) {
        res.send({
            success: false,
            message: 'неверный логин или пароль'
        }); 
        return;
    }
    res.send({
        success: true,
        refreshToken: token!,
        message: 'пользователь успешно авторизовался'
    });
});

app.post('/logout', (req: Request<{}, {}, LogoutRequest>, res: Response<LogoutResponse>) => {
    const { token } = req.body;
    if (!token) {
        res.status(400).send({
            success: false,
            message: 'Токен не предоставлен'
        });
        return;
    }
    const isLoggedOut = accountManager.logout(token);
    if (!isLoggedOut) {
        res.status(400).send({
            success: false,
            message: 'Неверный токен или пользователь уже вышел'
        });
        return;
    }
    res.send({
        success: true,
        message: 'Пользователь успешно разавторизовался'
    });
});

app.get('/status', (req, res) => {
    res.send({ status: "working", message: "Игровой сервер запущен. Слава Роду!" });
});

const gameManager = new GameManager();
const networkManager = new NetworkManager(
    io, 
    gameManager, 
    accountManager
);
networkManager.init();

httpServer.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`  ИГРОВОЙ СЕРВЕР УСПЕШНО ЗАПУЩЕН!`);
    console.log(`  Адрес: http://localhost:${PORT}`);
    console.log(`==================================================\n`);
});