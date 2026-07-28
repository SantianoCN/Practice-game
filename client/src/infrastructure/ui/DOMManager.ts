import { Archetype, PlayerClassPresetDTO, StartingWeaponStats, PlayerProgressDTO, SHOP_PRICES } from '@game/shared';
import { ASSETS } from '../../../assets';

export class DOMManager {
    public onAuthReq?: (url: string, l: string, p: string) => void;
    public onCreateRoom?: (arch: Archetype, weapon: string) => void;
    public onCreateLobby?: (arch: Archetype, weapon: string) => void;
    public onJoinRoom?: (sid: string, arch: Archetype, weapon: string) => void;
    public onStartMatch?: () => void;
    public onLeaveRoom?: () => void;
    public onLogout?: () => void;
    public onBuyItem?: (presetId: string) => void;
    public onCompleteSession?: () => void;
    public onRestoreSave?: () => void;
    private selectedArch: Archetype = 'warrior';
    private selectedWeapon = '';
    private progress?: PlayerProgressDTO;
    public onPortalNextFloor?: () => void;
    public onPortalSaveAndExit?: () => void;

    constructor() {
        this.bindEvents();
    }

    private bindEvents(): void {
        document.getElementById('portalCloseBtn')?.addEventListener('click', () => {
            this.showPortalModal(false);
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.showPortalModal(false);
            }
        });

        document.getElementById('loginBtn')?.addEventListener('click', () => {
            const l = (document.getElementById('username') as HTMLInputElement).value;
            const p = (document.getElementById('password') as HTMLInputElement).value;
            this.onAuthReq?.('login', l, p);
        });

        document.getElementById('registerBtn')?.addEventListener('click', () => {
            const l = (document.getElementById('username') as HTMLInputElement).value;
            const p = (document.getElementById('password') as HTMLInputElement).value;
            this.onAuthReq?.('register', l, p);
        });

        document.getElementById('createRoomBtn')?.addEventListener('click', () => {
            this.onCreateRoom?.(this.selectedArch, this.selectedWeapon);
        });

        document.getElementById('createLobbyBtn')?.addEventListener('click', () => {
            this.onCreateLobby?.(this.selectedArch, this.selectedWeapon);
        });

        document.getElementById('restoreSaveBtn')?.addEventListener('click', () => {
            this.onRestoreSave?.();
        });

        document.getElementById('joinRoomBtn')?.addEventListener('click', () => {
            const sid = (document.getElementById('sessionIdInput') as HTMLInputElement).value;
            this.onJoinRoom?.(sid, this.selectedArch, this.selectedWeapon);
        });

        document.getElementById('startMatchBtn')?.addEventListener('click', () => {
            this.onStartMatch?.();
        });

        document.getElementById('completeSessionBtn')?.addEventListener('click', () => {
            this.onCompleteSession?.();
        });

        document.getElementById('logoutBtn')?.addEventListener('click', () => this.onLogout?.());
        document.getElementById('disconnectBtn')?.addEventListener('click', () => this.onLeaveRoom?.());

        document.getElementById('copySessionBtn')?.addEventListener('click', () => {
            const btn = document.getElementById('copySessionBtn') as HTMLButtonElement | null;
            const text = document.getElementById('sessionDisplay')?.textContent?.trim() || '';

            if (!btn || !text) return;

            const textArea = document.createElement('textarea');
            textArea.value = text;
            
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);

            textArea.focus();
            textArea.select();

            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    btn.innerText = 'СКОПИРОВАНО!';
                    btn.classList.add('button-copied');
                    setTimeout(() => {
                        btn.innerText = 'СКОПИРОВАТЬ';
                        btn.classList.remove('button-copied');
                    }, 1200);
                }
            } catch (err) {
                console.error('Ошибка копирования:', err);
            } finally {
                document.body.removeChild(textArea);
            }
        });

        document.getElementById('portalNextBtn')?.addEventListener('click', () => {
            this.onPortalNextFloor?.();
        });

        document.getElementById('portalSaveBtn')?.addEventListener('click', () => {
            this.onPortalSaveAndExit?.();
        });
    }

    public updateHostStatus(isHost: boolean): void {
        const completeBtn = document.getElementById('completeSessionBtn');
        if (completeBtn) {
            completeBtn.classList.toggle('hidden', !isHost);
        }
    }

    public showAuth(error?: string): void {
        document.getElementById('auth-screen')!.classList.remove('hidden');
        document.getElementById('lobby-screen')!.classList.add('hidden');
        document.getElementById('game-screen')!.classList.add('hidden');

        const errEl = document.getElementById('errorText')!;
        if (error) {
            errEl.innerText = error;
            errEl.classList.remove('hidden');
        } else {
            errEl.classList.add('hidden');
        }
    }

    public showLobby(login: string): void {
        document.getElementById('auth-screen')!.classList.add('hidden');
        document.getElementById('lobby-screen')!.classList.remove('hidden');
        document.getElementById('game-screen')!.classList.add('hidden');
        document.getElementById('welcomeText')!.innerText = `РУС: ${login}`;
        document.getElementById('lobbyError')?.classList.add('hidden');
    }

    public showContinueButton(show: boolean): void {
        const sec = document.getElementById('continueSection');
        if (!sec) return;
        if (show) {
            sec.classList.remove('hidden');
        } else {
            sec.classList.add('hidden');
        }
    }

    public showGame(sessionId: string, isSingleplayer: boolean = false, isHost: boolean = false): void {
        document.getElementById('auth-screen')!.classList.add('hidden');
        document.getElementById('lobby-screen')!.classList.add('hidden');
        document.getElementById('game-screen')!.classList.remove('hidden');

        const sessionContainer = document.getElementById('sessionContainer')!;
        const copyBtn = document.getElementById('copySessionBtn')!;
        const sessionDisplay = document.getElementById('sessionDisplay')!;
        const completeBtn = document.getElementById('completeSessionBtn')!;

        if (isSingleplayer) {
            sessionContainer.classList.add('hidden');
            copyBtn.classList.add('hidden');
            completeBtn.classList.remove('hidden');
        } else {
            sessionContainer.classList.remove('hidden');
            copyBtn.classList.remove('hidden');
            sessionDisplay.innerText = sessionId;

            if (isHost) {
                completeBtn.classList.remove('hidden');
            } else {
                completeBtn.classList.add('hidden');
            }
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
        err.classList.remove('hidden');
    }

    public updatePresets(presets: Record<string, PlayerClassPresetDTO>, progress?: PlayerProgressDTO): void {
        if (progress) {
            this.progress = progress;
            const goldEl = document.getElementById('lobbyGold');
            if (goldEl) goldEl.innerText = `${progress.gold}`;
        }

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

            const isUnlocked = this.progress ? this.progress.unlockedClasses.includes(key) : true;
            if (!isUnlocked) {
                el.classList.add('locked');
            }

            if (this.selectedArch === key) {
                el.classList.add('active');
            }

            let iconAlt = '';
            switch(key) {
                case 'mage':
                    iconAlt = ASSETS.hero.volhvPrev;
                    break;
                case 'warrior':
                    iconAlt = ASSETS.hero.warriorPrev;
                    break;
            }
            const iconHtml = `<img src="${iconAlt}" alt="${key}" class="hero-card-img" />`;

            el.innerHTML = `
                <div class="hero-card-icon">${iconHtml}</div>
                <div class="hero-card-details">
                    <div class="hero-card-name">${preset.name} ${!isUnlocked ? '(ЗАБЛОК.)' : ''}</div>
                    <div class="hero-card-desc">${preset.description}</div>
                </div>
            `;

            el.onclick = () => {
                Array.from(heroList.children).forEach(c => c.classList.remove('active'));
                el.classList.add('active');

                this.selectedArch = key;
                this.updateWeapons(preset.startingWeapons);
                this.updatePreview(presets);
            };

            heroList.appendChild(el);
        });

        this.updateWeapons(presets[this.selectedArch].startingWeapons);
        this.updatePreview(presets);
    }

    private updateWeapons(weapons: StartingWeaponStats[]): void {
        const wList = document.getElementById('weaponCardList')!;
        wList.innerHTML = '';

        if (!weapons || weapons.length === 0) return;

        this.selectedWeapon = weapons[0].key;

        weapons.forEach(w => {
            const el = document.createElement('div');
            el.className = 'weapon-card';

            const isUnlocked = this.progress ? this.progress.unlockedWeapons.includes(w.key) : true;
            if (!isUnlocked) {
                el.classList.add('locked');
            }

            if (this.selectedWeapon === w.key) {
                el.classList.add('active');
            }

            let imgSrc = ASSETS.weapon.ironSword;
            if (w.key === 'wpn_heavy_axe') imgSrc = ASSETS.weapon.battleAxe;
            if (w.key === 'wpn_fire_staff') imgSrc = ASSETS.weapon.fireStaff;
            if (w.key === 'wpn_ice_staff') imgSrc = ASSETS.weapon.iceStaff;

            const iconHtml = `<img src="${imgSrc}" alt="${w.name}" class="weapon-card-img" />`;

            el.innerHTML = `
                <div>${iconHtml}</div>
                <div class="weapon-name">${w.name} ${!isUnlocked ? '(ЗАКРЫТО)' : ''}</div>
                <div class="weapon-desc">${w.description || 'Базовое оружие'}</div>
            `;

            el.onclick = () => {
                Array.from(wList.children).forEach(c => c.classList.remove('active'));
                el.classList.add('active');
                this.selectedWeapon = w.key;

                const presetsElement = document.getElementById('heroCardList')!;
                if (presetsElement) {
                    const presets = (window as any).__classPresets;
                    if (presets) this.updatePreview(presets);
                }
            };

            wList.appendChild(el);
        });
    }

    private updatePreview(presets: Record<string, PlayerClassPresetDTO>): void {
        (window as any).__classPresets = presets;
        const preset = presets[this.selectedArch];
        if (!preset) return;

        const container = document.getElementById('heroPreviewSprite')!;
        container.innerHTML = '';

        const isClassUnlocked = this.progress ? this.progress.unlockedClasses.includes(this.selectedArch) : true;
        const isWeaponUnlocked = this.progress ? this.progress.unlockedWeapons.includes(this.selectedWeapon) : true;

        if (!isClassUnlocked) {
            const price = SHOP_PRICES[this.selectedArch] || 300;
            const buyContainer = document.createElement('div');
            buyContainer.className = 'buy-button-container';

            const titleDiv = document.createElement('div');
            titleDiv.className = 'buy-title';
            titleDiv.innerText = 'ЭТОТ КЛАСС ЕЩЕ ЗАПЕРТ!';

            const buyBtn = document.createElement('button');
            buyBtn.className = 'button button-success';
            buyBtn.style.width = '240px';
            buyBtn.innerText = `КУПИТЬ ЗА ${price} `;

            const coinImg = document.createElement('img');
            coinImg.className = 'coin-icon';
            coinImg.src = ASSETS.loot.coin;
            coinImg.alt = 'Монета';

            buyBtn.appendChild(coinImg);
            buyBtn.onclick = () => {
                this.onBuyItem?.(this.selectedArch);
            };

            buyContainer.appendChild(titleDiv);
            buyContainer.appendChild(buyBtn);
            container.appendChild(buyContainer);

            const nameSpan = document.createElement('span');
            nameSpan.className = 'hero-name';
            nameSpan.id = 'heroPreviewName';
            nameSpan.innerText = `${preset.name} (КУПИТЬ)`;
            container.appendChild(nameSpan);

        } else if (!isWeaponUnlocked) {
            const price = SHOP_PRICES[this.selectedWeapon] || 150;
            const buyContainer = document.createElement('div');
            buyContainer.className = 'buy-button-container';

            const titleDiv = document.createElement('div');
            titleDiv.className = 'buy-title';
            titleDiv.innerText = 'ОРУЖИЕ ЕЩЕ ЗАПЕРТО!';

            const buyBtn = document.createElement('button');
            buyBtn.className = 'button button-success';
            buyBtn.style.width = '240px';
            buyBtn.innerText = `КУПИТЬ ЗА ${price} `;

            const coinImg = document.createElement('img');
            coinImg.className = 'coin-icon';
            coinImg.src = ASSETS.loot.coin;
            coinImg.alt = 'Монета';

            buyBtn.appendChild(coinImg);
            buyBtn.onclick = () => {
                this.onBuyItem?.(this.selectedWeapon);
            };

            buyContainer.appendChild(titleDiv);
            buyContainer.appendChild(buyBtn);
            container.appendChild(buyContainer);

            const nameSpan = document.createElement('span');
            nameSpan.className = 'hero-name';
            nameSpan.id = 'heroPreviewName';
            nameSpan.innerText = `ОРУЖИЕ ЗАКРЫТО`;
            container.appendChild(nameSpan);

        } else {
            const spriteDiv = document.createElement('div');
            spriteDiv.className = 'hero-sprite';

            const img = document.createElement('img');
            img.className = 'hero-sprite-img';
            img.src = this.selectedArch === 'mage' ? ASSETS.hero.volhvPrev : ASSETS.hero.warriorPrev;
            img.alt = 'Спрайт героя';

            spriteDiv.appendChild(img);
            container.appendChild(spriteDiv);

            const nameSpan = document.createElement('span');
            nameSpan.className = 'hero-name';
            nameSpan.id = 'heroPreviewName';
            nameSpan.innerText = preset.name;

            container.appendChild(nameSpan);
        }
    }

    public showToast(message: string, type: 'info' | 'error' | 'success' = 'info', durationMs: number = 3500): void {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerText = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-hide');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, durationMs);
    }

    public showPortalModal(show: boolean): void {
        const modal = document.getElementById('portalModal');
        if (!modal) return;
        if (show) {
            modal.classList.remove('hidden');
        } else {
            modal.classList.add('hidden');
        }
    }

    public resetState(): void {
        this.selectedArch = 'warrior';
        this.selectedWeapon = '';
        this.progress = undefined;
    }
}