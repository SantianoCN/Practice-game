import { NetworkClient } from "./network/NetworClient";

const token = localStorage.getItem('session_token');
if (!token) {
  window.location.href = '/index.html';
}

const welcomeText = document.getElementById('welcomeText') as HTMLDivElement;
if (welcomeText && token) {
  welcomeText.innerText = `Рады видеть тебя, Рус по имени ${token}!`;
}

const network = new NetworkClient();
const createRoomButton = document.getElementById('createRoomBtn') as HTMLButtonElement;
const joinRoomButton = document.getElementById('joinRoomBtn') as HTMLButtonElement;
const sessionIdInput = document.getElementById('sessionIdInput') as HTMLInputElement;
const lobbyError = document.getElementById('lobbyError') as HTMLDivElement;

createRoomButton.addEventListener('click', async () => {
  try {
    await network.connect(token!);
    
    const res = await network.createSession({ name: token!, archetype: 'warrior' });
    
    if (res.sessionId) {
      localStorage.setItem('game_session_id', res.sessionId);
      network.disconnect();
      
      window.location.href = '/game.html';
    }
  } catch (err) {
    showError('Не удалось создать комнату');
    network.disconnect();
  }
});

joinRoomButton.addEventListener('click', async () => {
  const sessionId = sessionIdInput.value.trim();
  if (!sessionId) {
    showError('Введите ID сессии');
    return;
  }

  try {
    await network.connect(token!);
    
    const res = await network.joinSession({ sessionId, name: token!, archetype: 'warrior' });
    
    if (res.sessionId) {
      localStorage.setItem('game_session_id', res.sessionId);
      network.disconnect();
      window.location.href = '/game.html';
    } else {
      showError('Не удалось подключиться к сессии');
      network.disconnect();
    }
  } catch (err) {
    showError('Комната не найдена или сервер недоступен');
    network.disconnect();
  }
});

function showError(message: string) {
  lobbyError.innerText = message;
  lobbyError.style.display = 'block';
}

const logoutBtn = document.getElementById('logoutBtn') as HTMLButtonElement;

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('session_token');
    localStorage.removeItem('game_session_id');
    window.location.href = '/index.html';
  });
}