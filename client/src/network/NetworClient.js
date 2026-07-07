const { io } = require('socket.io-client');

class NetworkClient {
  constructor(serverUrl = 'http://26.218.158.162:3000') {
    this.socket = null;
    this.serverUrl = serverUrl;
    this.onStateUpdateCallback = null;
  }

  connect() {
    if (this.socket) return;
    
    this.socket = io(this.serverUrl, {transports: ['websocket']});

    this.socket.on('connect', () => {
      console.log('Подключено к серверу! ID:', this.socket.id);
    });


    this.socket.on('gameStateUpdate', (data) => {
      if (this.onStateUpdateCallback) {
        this.onStateUpdateCallback(data);
      }
    });

    this.socket.on('connect_error', (err) => {
      console.error('Ошибка подключения:', err.message);
    });

    this.socket.on('disconnect', () => {
      console.warn('Отключено от сервера');
    });
  }

  onGameStateUpdate(callback) {
    this.onStateUpdateCallback = callback;
  }

  sendPlayerAction(action) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('playerAction', action);
    } else {
      console.warn('Нет соединения с сервером!');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

const socket = io('http://26.218.158.162:3000', { transports: ['websocket'] });

socket.on('connect', () => {
  console.log('✅ Подключено! ID:', socket.id);
  
  socket.emit('login', {
    login: 'Maximm',
    password: '123'
  });
  console.log('📤 Отправлен login: Maxim');
  

  socket.once('response', (data) => {
    console.log('📥 Получен ответ:', data);
  });
});
