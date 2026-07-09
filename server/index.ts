import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { NetworkManager } from './src/managers/NetworkManager';
import GameManager from './src/managers/GameManager';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

app.get('/status', (req, res) => {
    res.send({ status: "working", message: "Игровой сервер запущен. Слава Роду!" });
});

const gameManager = new GameManager();
const networkManager = new NetworkManager(io, gameManager);
networkManager.init();

httpServer.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`  ИГРОВОЙ СЕРВЕР УСПЕШНО ЗАПУЩЕН!`);
    console.log(`  Адрес: http://localhost:${PORT}`);
    console.log(`==================================================\n`);
});