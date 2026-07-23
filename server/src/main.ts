import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { PrismaClient } from '@prisma/client';

import { InMemoryGameRepo } from './infrastructure/persistence/InMemoryGameRepo';
import { CryptoIdGenerator } from './infrastructure/utils/CryptoIdGenerator';
import { SocketBroadcaster } from './infrastructure/network/SocketBroadcaster';
import { SocketController } from './infrastructure/network/SocketController';
import { PrismaAccountRepo } from './infrastructure/persistence/PrismaAccountRepo';
import { StaticPresetProvider } from './infrastructure/providers/StaticPresetProvider';
import { SessionManagementUseCase } from './application/use-cases/SessionManagementUseCase';
import { ProcessInputUseCase } from './application/use-cases/ProcessInputUseCase';
import { GameTickUseCase } from './application/use-cases/GameTickUseCase';
import { AuthUseCase } from './application/use-cases/AuthUseCase';
import { OpenChestUseCase } from './application/use-cases/OpenChestUseCase';
import { BuyItemUseCase } from './application/use-cases/BuyItemUseCase'; 
import { CompleteSessionUseCase } from './application/use-cases/CompleteSessionUseCase';
import { GAME_CONFIG, LoginDataSchema } from '@game/shared';
import { NextFloorUseCase } from './application/use-cases/NextFloorUseCase';
import { SaveSessionUseCase } from './application/use-cases/SaveSessionUseCase';
import { PrismaSaveRepo } from './infrastructure/persistence/PrismaSaveRepo';

async function bootstrap() {
    const PORT = process.env.PORT || 3000;
    const HOST = process.env.HOST || '0.0.0.0';
    const CLIENT_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

    const app = express();
    app.use(cors({
        origin: CLIENT_ORIGIN,
        credentials: true
    }));
    app.use(express.json());

    const clientBuildPath = path.join(__dirname, '../../public');
    app.use(express.static(clientBuildPath));

    const httpServer = createServer(app);
    const io = new Server(httpServer, {
        cors: {
            origin: CLIENT_ORIGIN,
            credentials: true
        }
    });

    const prisma = new PrismaClient();
    const accountRepo = new PrismaAccountRepo(prisma);
    const gameRepo = new InMemoryGameRepo();
    const saveRepo = new PrismaSaveRepo(prisma);
    const idGen = new CryptoIdGenerator();
    const broadcaster = new SocketBroadcaster(io);
    const presetProvider = new StaticPresetProvider();
    const authUseCase = new AuthUseCase(accountRepo, idGen);
    const buyItemUseCase = new BuyItemUseCase(accountRepo); 
    const completeSessionUseCase = new CompleteSessionUseCase(gameRepo, accountRepo);
    const nextFloorUseCase = new NextFloorUseCase(gameRepo, presetProvider, idGen);
    const saveSessionUseCase = new SaveSessionUseCase(gameRepo, saveRepo);
    
    const sessionUseCase = new SessionManagementUseCase(
        gameRepo, 
        idGen, 
        presetProvider, 
        GAME_CONFIG.ROOM_WIDTH, 
        GAME_CONFIG.ROOM_HEIGHT,
        saveRepo
    );    
    const inputUseCase = new ProcessInputUseCase(gameRepo);
    const openChestUseCase = new OpenChestUseCase(gameRepo, presetProvider, idGen);
    const gameTickUseCase = new GameTickUseCase(
        gameRepo, 
        broadcaster, 
        idGen, 
        openChestUseCase, 
        presetProvider
    );

    app.post('/register', async (req, res) => {
        const parsed = LoginDataSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).send({ success: false, message: 'Некорректные данные логина или пароля' });
        }

        const result = await authUseCase.register(parsed.data);
        if (!result) return res.send({ success: false, message: 'Пользователь уже существует' });

        res.send({ 
            success: true, 
            refreshToken: result.token
        });
    });

    app.post('/login', async (req, res) => {
        const parsed = LoginDataSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).send({ success: false, message: 'Некорректные данные логина или пароля' });
        }

        if (parsed.data.login && isUserOnline(parsed.data.login)) {
            return res.send({ 
                success: false, 
                message: 'Аккаунт уже авторизован и находится в сети с другого устройства' 
            });
        }

        const result = await authUseCase.login(parsed.data);
        if (!result) return res.send({ success: false, message: 'Неверный логин или пароль' });

        res.send({ 
            success: true, 
            refreshToken: result.token
        });
    });

    app.post('/logout', async (req, res) => {
        if (!req.body.token) return res.status(400).send({ success: false });
        await authUseCase.logout(req.body.token);
        res.send({ success: true });
    });

    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Токен не обнаружен'));
        
        const account = await authUseCase.resolveToken(token);
        if (!account) return next(new Error('Неверный токен'));
        
        if (isUserOnline(account.login, socket.id)) {
            return next(new Error('Аккаунт уже авторизован на другом устройстве'));
        }

        socket.data.login = account.login;
        next();
    });

    io.on('connection', (socket) => {
        console.log(`[Network] Client connected: ${socket.id} (Login: ${socket.data.login})`);
        new SocketController(
            io, socket, sessionUseCase, inputUseCase, accountRepo, 
            buyItemUseCase, completeSessionUseCase, saveSessionUseCase, 
            nextFloorUseCase, saveRepo, socket.data.login
        );
    });

    const isUserOnline = (login: string, currentSocketId?: string): boolean => {
        for (const [_, socket] of io.sockets.sockets) {
            if (socket.data.login === login && socket.id !== currentSocketId) {
                return true;
            }
        }
        return false;
    };

    const TICK_INTERVAL = 1000 / GAME_CONFIG.TICK_RATE;
    let lastTime = performance.now();

    const tick = () => {
        const startTime = performance.now();
        const deltaTime = (startTime - lastTime) / 1000;
        lastTime = startTime;
        try {
            gameTickUseCase.execute(deltaTime, startTime);
        } catch (err) {
            console.error('[GameTick Fatal]', err);
        }
        const executionTime = performance.now() - startTime;
        setTimeout(tick, Math.max(0, TICK_INTERVAL - executionTime));
    };

    tick();

    httpServer.listen(Number(PORT), HOST, () => {
        console.log(`[Server] Clean Architecture Engine running on http://${HOST}:${PORT}`);
    });
}

bootstrap().catch(console.error);