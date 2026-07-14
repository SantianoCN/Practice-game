import { NetworkService } from '../../infrastructure/network/NetworkService';
import { StartingWeaponPreset } from '../../../../shared/gameTypes'

export class LobbyScreenController {
  private container: HTMLDivElement;
  private welcomeText: HTMLDivElement;
  private createRoomBtn: HTMLButtonElement;
  private joinRoomBtn: HTMLButtonElement;
  private sessionIdInput: HTMLInputElement;
  private lobbyError: HTMLDivElement;
  private logoutBtn: HTMLButtonElement;
  private classSelect: HTMLSelectElement;
  private classDescription: HTMLDivElement;
  private weaponSelect: HTMLSelectElement;
  private weaponDescription: HTMLDivElement;
  private network: NetworkService;
  private token: string;
  
  private selectedArchetype: string = 'warrior';
  private selectedWeaponId: string = '';

  private onJoinSession: (sessionId: string) => void;
  private onLogout: () => void;

  constructor(
    network: NetworkService,
    token: string,
    onJoinSession: (sessionId: string) => void,
    onLogout: () => void
  ) {
    this.container = document.getElementById('lobby-screen') as HTMLDivElement;
    this.welcomeText = document.getElementById('welcomeText') as HTMLDivElement;
    this.createRoomBtn = document.getElementById('createRoomBtn') as HTMLButtonElement;
    this.joinRoomBtn = document.getElementById('joinRoomBtn') as HTMLButtonElement;
    this.sessionIdInput = document.getElementById('sessionIdInput') as HTMLInputElement;
    this.lobbyError = document.getElementById('lobbyError') as HTMLDivElement;
    this.logoutBtn = document.getElementById('logoutBtn') as HTMLButtonElement;
    this.classSelect = document.getElementById('classSelect') as HTMLSelectElement;
    this.classDescription = document.getElementById('classDescription') as HTMLDivElement;
    this.weaponSelect = document.getElementById('weaponSelect') as HTMLSelectElement;
    this.weaponDescription = document.getElementById('weaponDescription') as HTMLDivElement;

    this.network = network;
    this.token = token;
    this.onJoinSession = onJoinSession;
    this.onLogout = onLogout;

    this.init();
  }

  public show(token: string): void {
    this.token = token;
    this.welcomeText.innerText = `Рады видеть тебя, Рус по имени ${token}!`;
    this.container.classList.remove('hidden');
    this.lobbyError.style.display = 'none';
  }

  public hide(): void {
    this.container.classList.add('hidden');
  }

  private init(): void {
    this.createRoomBtn.addEventListener('click', async () => {
      try {
        const res = await this.network.createSession({ 
          name: this.token!, 
          archetype: this.selectedArchetype,
          weaponId: this.selectedWeaponId
        });
        
        if (res.success && res.sessionId) {
          this.onJoinSession(res.sessionId);
        } else {
          this.showError(res.message || 'Не удалось создать комнату');
        }
      } catch (err) {
        this.showError('Не удалось создать комнату');
      }
    });

    this.joinRoomBtn.addEventListener('click', async () => {
      const sessionId = this.sessionIdInput.value.trim();
      if (!sessionId) {
        this.showError('Введите ID сессии');
        return;
      }

      try {
        const res = await this.network.joinSession({ 
          sessionId, 
          name: this.token!, 
          archetype: this.selectedArchetype,
          weaponId: this.selectedWeaponId
        });
        
        if (res.success && res.sessionId) {
          this.onJoinSession(res.sessionId);
        } else {
          this.showError(res.message || 'Не удалось подключиться к сессии');
        }
      } catch (err) {
        this.showError('Комната не найдена или сервер недоступен');
      }
    });

    this.logoutBtn.addEventListener('click', () => {
      this.onLogout();
    });
  }

  public updateClassPresets(presets: any): void {
    this.classSelect.innerHTML = ''; 

    Object.entries(presets).forEach(([key, value]: [string, any]) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = `${value.name}`;
      this.classSelect.appendChild(option);
    });

    const updateClassHandler = () => {
      const selectedClass = this.classSelect.value;
      const classPreset = presets[selectedClass];
      
      this.classDescription.innerText = classPreset?.description || '';
      
      this.selectedArchetype = selectedClass; 

      this.updateWeaponSelection(classPreset?.startingWeapons || []);
    };

    this.classSelect.addEventListener('change', updateClassHandler);
    updateClassHandler();
  }

  private updateWeaponSelection(weapons: StartingWeaponPreset[]): void {
    this.weaponSelect.innerHTML = ''; 

    weapons.forEach((weapon: StartingWeaponPreset) => {
      const option = document.createElement('option');
      option.value = weapon.key;
      option.textContent = weapon.name;
      this.weaponSelect.appendChild(option);
    });

    const updateWeaponHandler = () => {
      const selectedWeaponId = this.weaponSelect.value;
      const weapon = weapons.find(w => w.key === selectedWeaponId);
      
      this.weaponDescription.innerText = weapon?.description || '';
      
      this.selectedWeaponId = selectedWeaponId; 
    };

    this.weaponSelect.addEventListener('change', updateWeaponHandler);
    updateWeaponHandler(); 
  }

  private showError(message: string): void {
    this.lobbyError.innerText = message;
    this.lobbyError.style.display = 'block';
  }
}