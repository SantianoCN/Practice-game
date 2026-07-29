import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import cookieParser from 'cookie-parser';
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

function parseCookies(cookieHeader?: string): Record<string, string> {
    const list: Record<string, string> = {};
    if (!cookieHeader) return list;

    const pairs = cookieHeader.split(';');
    for (const pair of pairs) {
        const index = pair.indexOf('=');
        if (index < 0) continue;

        const key = pair.slice(0, index).trim();
        const val = pair.slice(index + 1).trim();

        if (key) {
            try {
                list[key] = decodeURIComponent(val);
            } catch {
                list[key] = val;
            }
        }
    }

    return list;
}


async function bootstrap() {
    const PORT = process.env.PORT || 3000;
    const CLIENT_ORIGIN = process.env.CORS_ORIGIN || 'http://217.114.14.204:5173';

    const app = express();
    app.use(cors({
        origin: CLIENT_ORIGIN,
        credentials: true
    }));
    app.use(express.json());
    app.use(cookieParser());

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

    app.post('/auth/check', async (req, res) => {
        const token = req.cookies.refresh_token;

        if (!token) {
            return res.status(401).send({ 
                success: false, 
                authenticated: false, 
                message: 'Необходима авторизация' 
            });
        }

        const account = await authUseCase.resolveToken(token);
        if (!account) {
            res.clearCookie('refresh_token');
            return res.status(401).send({ 
                success: false, 
                authenticated: false, 
                message: 'Сессия недействительна или просрочена' 
            });
        }

        const progressDTO = account.progress ? {
            gold: account.progress.gold,
            unlockedClasses: account.progress.unlockedClasses,
            unlockedWeapons: account.progress.unlockedWeapons
        } : undefined;

        const currentSessionId = sessionUseCase.findActiveSessionByAccountId(account.id);

        if (currentSessionId) {
            const session = sessionUseCase.getSession(currentSessionId);
            if (session) {
                return res.send({
                    success: true,
                    authenticated: true,
                    login: account.login,
                    progress: progressDTO,
                    currentSessionId,
                    isSingleplayer: session.isSingleplayer,
                    isHost: session.hostAccountId === account.id
                });
            } else {
                return res.send({
                    success: true,
                    authenticated: true,
                    login: account.login,
                    progress: progressDTO,
                    currentSessionId: null,
                    message: 'Ваша сессия сейчас не активна'
                });
            }
        }

        const save = await saveRepo.getRunSaveByHostAccountId(account.id);
        return res.send({
            success: true,
            authenticated: true,
            login: account.login,
            progress: progressDTO,
            activeSaveSessionId: save?.id || null,
            currentSessionId: null
        });
    });

    app.post('/register', async (req, res) => {
        const parsed = LoginDataSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).send({ success: false, message: 'Некорректные данные логина или пароля' });
        }

        const result = await authUseCase.register(parsed.data);
        if (!result) return res.send({ success: false, message: 'Пользователь уже существует' });

        res.cookie('refresh_token', result.token, {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.send({ success: true, login: result.account.login });
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

        res.cookie('refresh_token', result.token, {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.send({ success: true, login: result.account.login });
    });

    app.post('/logout', async (req, res) => {
        const token = req.cookies.refresh_token;
        if (token) {
            await authUseCase.logout(token);
        }
        res.clearCookie('refresh_token', { path: '/' });
        res.send({ success: true });
    });

    io.use(async (socket, next) => {
        const cookies = parseCookies(socket.handshake.headers.cookie);
        const token = cookies.refresh_token;

        if (!token) return next(new Error('Токен не обнаружен в куках'));
        
        const account = await authUseCase.resolveToken(token);
        if (!account) return next(new Error('Неверный или просроченный токен'));
        
        if (isUserOnline(account.login, socket.id)) {
            return next(new Error('Аккаунт уже авторизован на другом устройстве'));
        }

        socket.data.login = account.login;
        socket.data.accountId = account.id;
        socket.data.lastActivity = Date.now();

        socket.onAny(() => {
            socket.data.lastActivity = Date.now();
        });

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

    const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
    setInterval(async () => {
        const now = Date.now();
        for (const [_, socket] of io.sockets.sockets) {
            if (socket.data.lastActivity && (now - socket.data.lastActivity > INACTIVITY_TIMEOUT_MS)) {
                console.log(`[Inactivity Timeout] Отключение неактивного игрока: ${socket.data.login}`);
                if (socket.data.accountId) {
                    await authUseCase.logoutByAccountId(socket.data.accountId);
                }
                socket.emit('server:session-terminated', { message: 'Сессия закрыта из-за неактивности' });
                socket.disconnect(true);
            }
        }
    }, 60 * 1000);

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

    httpServer.listen(PORT, () => {
        console.log(`[Server] Clean Architecture Engine running on port ${PORT}`);
    });
}

bootstrap().catch(console.error);