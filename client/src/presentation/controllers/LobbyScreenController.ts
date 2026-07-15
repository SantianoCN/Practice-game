import { NetworkService } from '../../infrastructure/network/NetworkService';
import { StartingWeaponPreset } from '../../../../shared/gameTypes';

export class LobbyScreenController {
  private container: HTMLDivElement;
  private welcomeText: HTMLDivElement;
  private createRoomBtn: HTMLButtonElement;
  private joinRoomBtn: HTMLButtonElement;
  private sessionIdInput: HTMLInputElement;
  private lobbyError: HTMLDivElement;
  private logoutBtn: HTMLButtonElement;

  private heroCardList: HTMLDivElement;
  private weaponCardList: HTMLDivElement;

  private heroPreviewSprite: HTMLDivElement;
  private heroPreviewName: HTMLSpanElement;

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

    this.heroCardList = document.getElementById('heroCardList') as HTMLDivElement;
    this.weaponCardList = document.getElementById('weaponCardList') as HTMLDivElement;

    this.heroPreviewSprite = document.getElementById('heroPreviewSprite') as HTMLDivElement;
    this.heroPreviewName = document.getElementById('heroPreviewName') as HTMLSpanElement;

    this.network = network;
    this.token = token;
    this.onJoinSession = onJoinSession;
    this.onLogout = onLogout;

    this.init();
  }

  public show(token: string): void {
    this.token = token;
    this.welcomeText.innerText = `РУС: ${token}`;
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
          token: this.token!, 
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
          token: this.token!, 
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
    this.heroCardList.innerHTML = ''; 

    Object.entries(presets).forEach(([key, value]: [string, any]) => {
      const card = document.createElement('div');
      card.className = 'hero-card';
      card.setAttribute('data-id', key);

      const iconAlt = key === 'mage' ? 'Волхв' : 'Ратоборец';
      const iconHtml = `<img src="" alt="${iconAlt}" class="hero-card-img" />`;

      card.innerHTML = `
        <div class="hero-card-icon">${iconHtml}</div>
        <div class="hero-card-details">
            <div class="hero-card-name">${value.name}</div>
            <div class="hero-card-desc">${value.description}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        this.selectHeroCard(key, presets);
      });

      this.heroCardList.appendChild(card);
    });

    const firstHeroKey = Object.keys(presets)[0];
    if (firstHeroKey) {
      this.selectHeroCard(firstHeroKey, presets);
    }
  }

  private selectHeroCard(heroKey: string, presets: any) {
    const cards = this.heroCardList.querySelectorAll('.hero-card');
    cards.forEach(card => card.classList.remove('active'));

    const activeCard = this.heroCardList.querySelector(`[data-id="${heroKey}"]`);
    if (activeCard) activeCard.classList.add('active');

    this.selectedArchetype = heroKey;

    const classPreset = presets[heroKey];
    
    const iconAlt = heroKey === 'mage' ? 'Волхв' : 'Ратоборец';
    this.heroPreviewSprite.innerHTML = `<img src="" alt="${iconAlt}" class="hero-sprite-img" />`;
    this.heroPreviewName.innerText = classPreset.name;

    this.updateWeaponSelection(classPreset.startingWeapons || []);
  }

  private updateWeaponSelection(weapons: StartingWeaponPreset[]): void {
    this.weaponCardList.innerHTML = ''; 

    weapons.forEach((weapon: StartingWeaponPreset) => {
      const card = document.createElement('div');
      card.className = 'weapon-card';
      card.setAttribute('data-id', weapon.key);

      let weaponAlt = 'Меч';
      if (weapon.key === 'axe_heavy') weaponAlt = 'Секира Перуна';
      if (weapon.key === 'staff_fire') weaponAlt = 'Посох Огня';
      if (weapon.key === 'staff_ice') weaponAlt = 'Посох Хлада';

      let iconHtml = `<img src="./sprite/sword.png" alt="${weaponAlt}" class="weapon-card-img" />`;
      switch (weaponAlt) {
        case 'Секира Перуна':
          iconHtml = `<img src="./sprite/axe.png" alt="${weaponAlt}" class="weapon-card-img" />`;
          break;
        case 'Посох Огня':
          iconHtml = `<img src="./sprite/fireball.png" alt="${weaponAlt}" class="weapon-card-img" />`;
          break;
        case 'Посох Хлада':
          iconHtml = `<img src="./sprite/iceball.png" alt="${weaponAlt}" class="weapon-card-img" />`;
          break;
      }
      

      card.innerHTML = `
        <div class="weapon-icon">${iconHtml}</div>
        <div class="weapon-name">${weapon.name}</div>
        <div class="weapon-desc">${weapon.description}</div>
      `;

      card.addEventListener('click', () => {
        this.selectWeaponCard(weapon.key);
      });

      this.weaponCardList.appendChild(card);
    });

    if (weapons[0]) {
      this.selectWeaponCard(weapons[0].key);
    }
  }

  private selectWeaponCard(weaponId: string) {
    const cards = this.weaponCardList.querySelectorAll('.weapon-card');
    cards.forEach(card => card.classList.remove('active'));

    const activeCard = this.weaponCardList.querySelector(`[data-id="${weaponId}"]`);
    if (activeCard) activeCard.classList.add('active');

    this.selectedWeaponId = weaponId;
  }

  private showError(message: string): void {
    this.lobbyError.innerText = message;
    this.lobbyError.style.display = 'block';
  }
}