import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import NetworkManager from './managers/NetworkManager';

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

const networkManager = new NetworkManager(io);
networkManager.init();

httpServer.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`  ИГРОВОЙ СЕРВЕР УСПЕШНО ЗАПУЩЕН!`);
    console.log(`  Адрес: http://localhost:${PORT}`);
    console.log(`==================================================\n`);
});