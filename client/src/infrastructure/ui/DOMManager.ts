export class DOMManager {
    public onAuthReq?: (url: string, l: string, p: string) => void;
    public onCreateRoom?: (arch: string, weapon: string) => void;
    public onJoinRoom?: (sid: string, arch: string, weapon: string) => void;
    public onLeaveRoom?: () => void;
    public onLogout?: () => void;

    private selectedArch = '';
    private selectedWeapon = '';

    constructor() {
        this.bindEvents();
    }

    private bindEvents() {
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

        document.getElementById('createRoomBtn')?.addEventListener('click', () => {
            this.onCreateRoom?.(this.selectedArch, this.selectedWeapon);
        });

        document.getElementById('joinRoomBtn')?.addEventListener('click', () => {
            const sid = (document.getElementById('sessionIdInput') as HTMLInputElement).value;
            this.onJoinRoom?.(sid, this.selectedArch, this.selectedWeapon);
        });

        document.getElementById('logoutBtn')?.addEventListener('click', () => this.onLogout?.());

        document.getElementById('disconnectBtn')?.addEventListener('click', () => this.onLeaveRoom?.());
        
        document.getElementById('copySessionBtn')?.addEventListener('click', () => {
            const btn = document.getElementById('copySessionBtn')!;
            const text = document.getElementById('sessionDisplay')?.innerText || '';
            navigator.clipboard.writeText(text).then(() => {
                btn.innerText = 'СКОПИРОВАНО!';
                setTimeout(() => btn.innerText = 'СКОПИРОВАТЬ', 1200);
            });
        });
    }

    public showAuth(error?: string) {
        document.getElementById('auth-screen')!.classList.remove('hidden');
        document.getElementById('lobby-screen')!.classList.add('hidden');
        document.getElementById('game-screen')!.classList.add('hidden');
        if (error) {
            const errEl = document.getElementById('errorText')!;
            errEl.innerText = error;
            errEl.style.display = 'block';
        }
    }

    public showLobby(login: string) {
        document.getElementById('auth-screen')!.classList.add('hidden');
        document.getElementById('lobby-screen')!.classList.remove('hidden');
        document.getElementById('game-screen')!.classList.add('hidden');
        document.getElementById('welcomeText')!.innerText = `РУС: ${login}`;
    }

    public showGame(sessionId: string) {
        document.getElementById('auth-screen')!.classList.add('hidden');
        document.getElementById('lobby-screen')!.classList.add('hidden');
        document.getElementById('game-screen')!.classList.remove('hidden');
        document.getElementById('sessionDisplay')!.innerText = sessionId;
    }

    public showErrorLobby(msg: string) {
        const err = document.getElementById('lobbyError')!;
        err.innerText = msg;
        err.style.display = 'block';
    }

    public updatePresets(presets: any) {
        const heroList = document.getElementById('heroCardList')!;
        heroList.innerHTML = '';
        
        const presetKeys = Object.keys(presets);
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

            const iconAlt = key === 'mage' ? 'Волхв' : 'Ратоборец';
            const iconHtml = `<img src="" alt="${iconAlt}" class="hero-card-img" />`;

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
                this.updateWeapons(preset.startingWeapons);
            };

            heroList.appendChild(el);
        });

        document.getElementById('heroPreviewName')!.innerText = presets[this.selectedArch].name;
        this.updateWeapons(presets[this.selectedArch].startingWeapons);
    }

    private updateWeapons(weapons: any[]) {
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