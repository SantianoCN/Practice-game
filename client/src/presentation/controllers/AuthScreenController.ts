import { LoginData } from '../../../../shared/gameTypes';

export class AuthScreenController {
  private container: HTMLDivElement;
  private usernameInput: HTMLInputElement;
  private passwordInput: HTMLInputElement;
  private loginBtn: HTMLButtonElement;
  private registerBtn: HTMLButtonElement;
  private errorText: HTMLDivElement;
  
  private onLoginSuccess: (token: string, login: string) => void;

  constructor(onLoginSuccess: (token: string, login: string) => void) {
    this.container = document.getElementById('auth-screen') as HTMLDivElement;
    this.usernameInput = document.getElementById('username') as HTMLInputElement;
    this.passwordInput = document.getElementById('password') as HTMLInputElement;
    this.loginBtn = document.getElementById('loginBtn') as HTMLButtonElement;
    this.registerBtn = document.getElementById('registerBtn') as HTMLButtonElement;
    this.errorText = document.getElementById('errorText') as HTMLDivElement;
    this.onLoginSuccess = onLoginSuccess;

    this.init();
  }

  public show(): void {
    this.container.classList.remove('hidden');
    this.errorText.style.display = 'none';
    this.usernameInput.value = '';
    this.passwordInput.value = '';
  }

  public hide(): void {
    this.container.classList.add('hidden');
  }

  private init(): void {
    this.loginBtn.addEventListener('click', () => {
      this.handleAuthRequest('http://localhost:3000/login');
    });

    this.registerBtn.addEventListener('click', () => {
      this.handleAuthRequest('http://localhost:3000/register');
    });
  }

  private async handleAuthRequest(url: string): Promise<void> {
    const login = this.usernameInput.value.trim();
    const password = this.passwordInput.value.trim();

    if (!login || !password) {
      this.showError('Заполните все поля!');
      return;
    }

    const payload: LoginData = { login, password };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success && data.refreshToken) {
        this.onLoginSuccess(data.refreshToken, data.login);
      } else {
        this.showError(data.message || 'Ошибка авторизации');
      }
    } catch (error) {
      this.showError('Нет связи с сервером');
    }
  }

  private showError(message: string): void {
    this.errorText.innerText = message;
    this.errorText.style.display = 'block';
  }
}