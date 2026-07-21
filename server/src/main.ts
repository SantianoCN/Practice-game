import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

import { InMemoryGameRepo } from './infrastructure/persistence/InMemoryGameRepo';
import { CryptoIdGenerator } from './infrastructure/utils/CryptoIdGenerator';
import { SocketBroadcaster } from './infrastructure/network/SocketBroadcaster';
import { SocketController } from './infrastructure/network/SocketController';
import { PrismaAccountRepo } from './infrastructure/persistence/PrismaAccountRepo';

import { SessionManagementUseCase } from './application/use-cases/SessionManagementUseCase';
import { ProcessInputUseCase } from './application/use-cases/ProcessInputUseCase';
import { GameTickUseCase } from './application/use-cases/GameTickUseCase';
import { AuthUseCase } from './application/use-cases/AuthUseCase';
import { GAME_CONFIG } from '@game/shared';

async function bootstrap() {
    const app = express();
    app.use(cors());
    app.use(express.json());
    
    const httpServer = createServer(app);
    const io = new Server(httpServer, { cors: { origin: '*' } });

    const prisma = new PrismaClient();
    const accountRepo = new PrismaAccountRepo(prisma);
    const gameRepo = new InMemoryGameRepo();
    const idGen = new CryptoIdGenerator();
    const broadcaster = new SocketBroadcaster(io);

    const authUseCase = new AuthUseCase(accountRepo, idGen);
    const sessionUseCase = new SessionManagementUseCase(gameRepo, idGen, GAME_CONFIG.ROOM_WIDTH, GAME_CONFIG.ROOM_HEIGHT);
    const inputUseCase = new ProcessInputUseCase(gameRepo);
    const gameTickUseCase = new GameTickUseCase(gameRepo, broadcaster, idGen);

    app.post('/register', async (req, res) => {
        const token = await authUseCase.register(req.body);
        if (!token) return res.send({ success: false, message: 'пользователь уже существует' });
        res.send({ success: true, refreshToken: token, login: req.body.login });
    });

    app.post('/login', async (req, res) => {
        const token = await authUseCase.login(req.body);
        if (!token) return res.send({ success: false, message: 'неверный логин или пароль' });
        res.send({ success: true, refreshToken: token, login: req.body.login });
    });

    app.post('/logout', async (req, res) => {
        if (!req.body.token) return res.status(400).send({ success: false });
        await authUseCase.logout(req.body.token);
        res.send({ success: true });
    });

    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Токен не обнаружен'));
        
        const login = await authUseCase.resolveToken(token);
        if (!login) return next(new Error('Неверный токен'));
        
        socket.data.login = login;
        next();
    });

    io.on('connection', (socket) => {
        console.log(`[Network] Client connected: ${socket.id} (Login: ${socket.data.login})`);
        new SocketController(socket, sessionUseCase, inputUseCase, socket.data.login);
    });

    const TICK_INTERVAL = 1000 / GAME_CONFIG.TICK_RATE;
    let lastTime = performance.now();

    const tick = () => {
        const startTime = performance.now();
        const deltaTime = (startTime - lastTime) / 1000;
        lastTime = startTime;
        gameTickUseCase.execute(deltaTime, startTime);
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        const nextDelay = Math.max(0, TICK_INTERVAL - executionTime);
        setTimeout(tick, nextDelay);
    }

    tick();

    const PORT = process.env.PORT || 3000;
    const HOST = 'localhost'; // Слушаем всю локальную сеть
    httpServer.listen(PORT, () => {
        console.log(`[Server] Clean Architecture Engine running on http://${HOST}:${PORT}`);
    });
}

bootstrap().catch(console.error);