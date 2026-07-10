import { LoginData } from '../../shared/gameTypes';

const loginForm = document.getElementById('loginForm') as HTMLFormElement;
const usernameInput = document.getElementById('username') as HTMLInputElement;
const passwordInput = document.getElementById('password') as HTMLInputElement;
const errorText = document.getElementById('errorText') as HTMLDivElement;

loginForm.addEventListener('submit', async () => {
  const login = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  const loginPayload: LoginData = {
    login: login,
    password: password
  };

  try {
    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginPayload)
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem('session_token', data.refreshToken);
      window.location.href = '/lobby.html';
    } else {
      showError(data.message || 'Неверный логин или пароль');
    }
  } catch (error) {
    showError('Нет связи с сервером');
  }
});

function showError(message: string) {
  errorText.innerText = message;
  errorText.style.display = 'block';
}