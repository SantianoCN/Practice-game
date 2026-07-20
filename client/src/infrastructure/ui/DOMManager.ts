import { Archetype, PlayerClassPresetDTO, StartingWeaponStats } from '@game/shared';
import warriorImgUrl from '../../../assets/hero/warrior-sword.png';
import mageImgUrl from '../../../assets/hero/volhv.png';

export class DOMManager {
    public onAuthReq?: (url: string, l: string, p: string) => void;
    public onCreateRoom?: (arch: Archetype, weapon: string) => void;   // Синглплеер
    public onCreateLobby?: (arch: Archetype, weapon: string) => void;  // Создать лобби
    public onJoinRoom?: (sid: string, arch: Archetype, weapon: string) => void; // Войти в лобби
    public onStartMatch?: () => void;  // Запустить поход (НОВЫЙ)
    
    public onLeaveRoom?: () => void;
    public onLogout?: () => void;

    private selectedArch: Archetype = 'warrior'; 
    private selectedWeapon = '';

    constructor() {
        this.bindEvents();
    }

    private bindEvents(): void {
        // Авторизация и регистрация
        document.getElementById('loginBtn')?.addEventListener('click', () => {
            const l = (document.getElementById('username') as HTMLInputElement).value;
            const p = (document.getElementById('password') as HTMLInputElement).value;
            this.onAuthReq?.('http://localhost:3000/login', l, p);
        });

        document.getElementById('registerBtn')?.addEventListener('click', () => {
            const l = (document.getElementById('username') as HTMLInputElement).value;
            const p = (document.getElementById('password') as HTMLInputElement).value;
            this.onAuthReq?.('http://localhost:3000/register', l, p);
        });

        // 1. Одиночная игра (Сингл)
        document.getElementById('createRoomBtn')?.addEventListener('click', () => {
            this.onCreateRoom?.(this.selectedArch, this.selectedWeapon);
        });

        // Создание лобби (СТАТЬ ВОЕВОДОЙ)
        document.getElementById('createLobbyBtn')?.addEventListener('click', () => {
            this.onCreateLobby?.(this.selectedArch, this.selectedWeapon);
        });

        // Вступление в отряд (В БОЙ!)
        document.getElementById('joinRoomBtn')?.addEventListener('click', () => {
            const sid = (document.getElementById('sessionIdInput') as HTMLInputElement).value;
            this.onJoinRoom?.(sid, this.selectedArch, this.selectedWeapon);
        });

        // Кнопка старта игры воеводой на экране Canvas
        document.getElementById('startMatchBtn')?.addEventListener('click', () => {
            this.onStartMatch?.();
        });

        // Системные кнопки выхода
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.onLogout?.());
        document.getElementById('disconnectBtn')?.addEventListener('click', () => this.onLeaveRoom?.());
        
        // Копирование ID сессии/лобби в буфер обмена
        document.getElementById('copySessionBtn')?.addEventListener('click', () => {
            const btn = document.getElementById('copySessionBtn')!;
            const text = document.getElementById('sessionDisplay')?.innerText || '';
            navigator.clipboard.writeText(text).then(() => {
                btn.innerText = 'СКОПИРОВАНО!';
                setTimeout(() => btn.innerText = 'СКОПИРОВАТЬ ID', 1200);
            });
        });
    }

    public showAuth(error?: string): void {
        document.getElementById('auth-screen')!.classList.remove('hidden');
        document.getElementById('lobby-screen')!.classList.add('hidden');
        document.getElementById('game-screen')!.classList.add('hidden');
        if (error) {
            const errEl = document.getElementById('errorText')!;
            errEl.innerText = error;
            errEl.style.display = 'block';
        }
    }

    public showLobby(login: string): void {
        document.getElementById('auth-screen')!.classList.add('hidden');
        document.getElementById('lobby-screen')!.classList.remove('hidden');
        document.getElementById('game-screen')!.classList.add('hidden');
        document.getElementById('welcomeText')!.innerText = `РУС: ${login}`;
    }

    public showGame(sessionId: string, isSingleplayer: boolean = false): void {
        document.getElementById('auth-screen')!.classList.add('hidden');
        document.getElementById('lobby-screen')!.classList.add('hidden');
        document.getElementById('game-screen')!.classList.remove('hidden');

        const sessionContainer = document.getElementById('sessionContainer')!;
        const copyBtn = document.getElementById('copySessionBtn')!;
        const sessionDisplay = document.getElementById('sessionDisplay')!;

        if (isSingleplayer) {
            sessionContainer.classList.add('hidden');
            copyBtn.classList.add('hidden');
        } else {
            sessionContainer.classList.remove('hidden');
            copyBtn.classList.remove('hidden');
            sessionDisplay.innerText = sessionId;
        }
    }

    public showStartMatchButton(show: boolean): void {
        const startBtn = document.getElementById('startMatchBtn')!;
        if (show) {
            startBtn.classList.remove('hidden');
        } else {
            startBtn.classList.add('hidden');
        }
    }

    public showErrorLobby(msg: string): void {
        const err = document.getElementById('lobbyError')!;
        err.innerText = msg;
        err.style.display = 'block';
    }

    public updatePresets(presets: Record<string, PlayerClassPresetDTO>): void {
        const heroList = document.getElementById('heroCardList')!;
        heroList.innerHTML = '';
        const presetKeys = Object.keys(presets) as Archetype[]; 
        
        if (presetKeys.length === 0) return;

        if (!this.selectedArch || !presets[this.selectedArch]) {
            this.selectedArch = presetKeys[0];
        }

        presetKeys.forEach(key => {
            const preset = presets[key];
            const el = document.createElement('div');
            el.className = 'hero-card';
            
            if (this.selectedArch === key) {
                el.classList.add('active');
            }

            let iconAlt = '';
            switch(key) {
                case 'mage':
                    iconAlt = mageImgUrl;
                    break;
                case 'warrior':
                    iconAlt = warriorImgUrl;
                    break;
            }
            const iconHtml = `<img src="${iconAlt}" alt="${key}" class="hero-card-img" />`;

            el.innerHTML = `
                <div class="hero-card-icon">${iconHtml}</div>
                <div class="hero-card-details">
                    <div class="hero-card-name">${preset.name}</div>
                    <div class="hero-card-desc">${preset.description}</div>
                </div>
            `;

            el.onclick = () => {
                Array.from(heroList.children).forEach(c => c.classList.remove('active'));
                el.classList.add('active');
                
                this.selectedArch = key;
                document.getElementById('heroPreviewName')!.innerText = preset.name;
                const previewImg = document.querySelector('#heroPreviewSprite img') as HTMLImageElement;
                if (previewImg) {
                    previewImg.src = key === 'mage' ? mageImgUrl : warriorImgUrl;
                }
                this.updateWeapons(preset.startingWeapons);
            };

            heroList.appendChild(el);
        });

        document.getElementById('heroPreviewName')!.innerText = presets[this.selectedArch].name;
        const defaultPreviewImg = document.querySelector('#heroPreviewSprite img') as HTMLImageElement;
        if (defaultPreviewImg) {
            defaultPreviewImg.src = this.selectedArch === 'mage' ? mageImgUrl : warriorImgUrl;
        }
        this.updateWeapons(presets[this.selectedArch].startingWeapons);
    }

    private updateWeapons(weapons: StartingWeaponStats[]): void {
        const wList = document.getElementById('weaponCardList')!;
        wList.innerHTML = '';

        if (!weapons || weapons.length === 0) return;

        this.selectedWeapon = weapons[0].key;

        weapons.forEach(w => {
            const el = document.createElement('div');
            el.className = 'weapon-card';
            
            if (this.selectedWeapon === w.key) {
                el.classList.add('active');
            }

            let weaponAlt = 'Меч';
            if (w.key === 'axe_heavy') weaponAlt = 'Секира Перуна';
            if (w.key === 'staff_fire') weaponAlt = 'Посох Огня';
            if (w.key === 'staff_ice') weaponAlt = 'Посох Хлада';

            let iconHtml = `<img src="../../../assets/sword.png" alt="${weaponAlt}" class="weapon-card-img" />`;
            switch (weaponAlt) {
                case 'Секира Перуна':
                    iconHtml = `<img src="../../../assets/axe.png" alt="${weaponAlt}" class="weapon-card-img" />`;
                    break;
                case 'Посох Огня':
                    iconHtml = `<img src="../../../assets/fireball.png" alt="${weaponAlt}" class="weapon-card-img" />`;
                    break;
                case 'Посох Хлада':
                    iconHtml = `<img src=".../../../assets/iceball.png" alt="${weaponAlt}" class="weapon-card-img" />`;
                    break;
            }

            el.innerHTML = `
                <div class="weapon-card-img">${iconHtml}</div>
                <div class="weapon-name">${w.name}</div>
                <div class="weapon-desc">${w.description || 'Базовое оружие'}</div>
            `;

            el.onclick = () => {
                Array.from(wList.children).forEach(c => c.classList.remove('active'));
                el.classList.add('active');
                this.selectedWeapon = w.key;
            };

            wList.appendChild(el);
        });
    }
}