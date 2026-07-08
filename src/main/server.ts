import express, { Request, Response } from 'express';
import { Server } from 'socket.io';
import { NetworkManager } from '../managers/networkManager';

const app = express();
const PORT = 3001;

const server = new NetworkManager(new Server(3000));
server.init();

app.get('/hello', (req: Request, res: Response) => {
  res.json({ 
    message: 'Привет, мир!',
    timestamp: new Date().toISOString(),
    status: 'Сервер работает 🚀'
  });
});

app.get('/status', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
  console.log(`📝 Проверьте эндпоинт: http://localhost:${PORT}/hello`);
  console.log(`📊 Статус: http://localhost:${PORT}/status`);
});


