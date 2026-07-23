"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const InMemoryGameRepo_1 = require("./infrastructure/persistence/InMemoryGameRepo");
const CryptoIdGenerator_1 = require("./infrastructure/utils/CryptoIdGenerator");
const SocketBroadcaster_1 = require("./infrastructure/network/SocketBroadcaster");
const SocketController_1 = require("./infrastructure/network/SocketController");
const PrismaAccountRepo_1 = require("./infrastructure/persistence/PrismaAccountRepo");
const StaticPresetProvider_1 = require("./infrastructure/providers/StaticPresetProvider");
const SessionManagementUseCase_1 = require("./application/use-cases/SessionManagementUseCase");
const ProcessInputUseCase_1 = require("./application/use-cases/ProcessInputUseCase");
const GameTickUseCase_1 = require("./application/use-cases/GameTickUseCase");
const AuthUseCase_1 = require("./application/use-cases/AuthUseCase");
const OpenChestUseCase_1 = require("./application/use-cases/OpenChestUseCase");
const shared_1 = require("@game/shared");
async function bootstrap() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    const httpServer = (0, http_1.createServer)(app);
    const io = new socket_io_1.Server(httpServer, { cors: { origin: '*' } });
    const prisma = new client_1.PrismaClient();
    const accountRepo = new PrismaAccountRepo_1.PrismaAccountRepo(prisma);
    const gameRepo = new InMemoryGameRepo_1.InMemoryGameRepo();
    const idGen = new CryptoIdGenerator_1.CryptoIdGenerator();
    const broadcaster = new SocketBroadcaster_1.SocketBroadcaster(io);
    const presetProvider = new StaticPresetProvider_1.StaticPresetProvider();
    const authUseCase = new AuthUseCase_1.AuthUseCase(accountRepo, idGen);
    const sessionUseCase = new SessionManagementUseCase_1.SessionManagementUseCase(gameRepo, idGen, presetProvider, shared_1.GAME_CONFIG.ROOM_WIDTH, shared_1.GAME_CONFIG.ROOM_HEIGHT);
    const inputUseCase = new ProcessInputUseCase_1.ProcessInputUseCase(gameRepo);
    const openChestUseCase = new OpenChestUseCase_1.OpenChestUseCase(gameRepo, presetProvider, idGen);
    const gameTickUseCase = new GameTickUseCase_1.GameTickUseCase(gameRepo, broadcaster, idGen, openChestUseCase, presetProvider);
    app.post('/register', async (req, res) => {
        const token = await authUseCase.register(req.body);
        if (!token)
            return res.send({ success: false, message: 'пользователь уже существует' });
        res.send({ success: true, refreshToken: token, login: req.body.login });
    });
    app.post('/login', async (req, res) => {
        const token = await authUseCase.login(req.body);
        if (!token)
            return res.send({ success: false, message: 'неверный логин или пароль' });
        res.send({ success: true, refreshToken: token, login: req.body.login });
    });
    app.post('/logout', async (req, res) => {
        if (!req.body.token)
            return res.status(400).send({ success: false });
        await authUseCase.logout(req.body.token);
        res.send({ success: true });
    });
    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token)
            return next(new Error('Токен не обнаружен'));
        const login = await authUseCase.resolveToken(token);
        if (!login)
            return next(new Error('Неверный токен'));
        socket.data.login = login;
        next();
    });
    io.on('connection', (socket) => {
        console.log(`[Network] Client connected: ${socket.id} (Login: ${socket.data.login})`);
        new SocketController_1.SocketController(socket, sessionUseCase, inputUseCase, socket.data.login);
    });
    const TICK_INTERVAL = 1000 / shared_1.GAME_CONFIG.TICK_RATE;
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
    };
    tick();
    const PORT = process.env.PORT || 3000;
    const HOST = '0.0.0.0';
    httpServer.listen(PORT, () => {
        console.log(`[Server] Clean Architecture Engine running on http://${HOST}:${PORT}`);
    });
}
bootstrap().catch(console.error);
