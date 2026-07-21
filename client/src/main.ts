import { DOMManager } from './infrastructure/ui/DOMManager';
import { SocketClient } from './infrastructure/network/SocketClient';
import { KeyboardAdapter } from './infrastructure/input/KeyboardAdapter';
import { CanvasRendererAdapter } from './infrastructure/render/CanvasRendererAdapter';
import { SyncStateUseCase } from './application/use-cases/SyncStateUseCase';
import { BaseResponseDTO } from '@game/shared';

class App {
    private ui = new DOMManager();
    private network = new SocketClient('http://localhost:3001');
    private input = new KeyboardAdapter();
    private renderer: CanvasRendererAdapter;
    private stateSync = new SyncStateUseCase();

    private myId = '';
    private gameLoopId?: number;
    private lastTime = performance.now();
    private isHost = false;

    constructor() {
        const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.renderer = new CanvasRendererAdapter(canvas);
        
        this.bindUiToNetwork();
        this.bindNetworkToApp();
        this.init();
    }

    private init(): void {
        const token = localStorage.getItem('session_token');
        if (token) this.connectToServer(token);
        else this.ui.showAuth();
    }

    private bindUiToNetwork(): void {
        this.ui.onAuthReq = async (url, login, password) => {
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ login, password })
                }).then(r => r.json() as Promise<BaseResponseDTO & { refreshToken?: string }>);

                if (res.success && res.refreshToken) {
                    localStorage.setItem('session_token', res.refreshToken);
                    this.connectToServer(res.refreshToken);
                } else {
                    this.ui.showAuth(res.message);
                }
            } catch (e) {
                this.ui.showAuth('Сервер недоступен (Connection Refused)');
            }
        };

        this.ui.onCreateRoom = async (arch, weapon) => {
            const token = localStorage.getItem('session_token');
            if (!token) return;
            this.isHost = false;
            this.ui.showStartMatchButton(false);
            
            // БЕЗОПАСНАЯ ПРЕВЕНТИВНАЯ ОЧИСТКА: стираем старые данные ДО запроса
            this.stateSync.clear();
            this.renderer.reset();
            
            const res = await this.network.createSession({ token, archetype: arch, weaponId: weapon });
            if (res.success && res.sessionId) {
                this.startGame(res.sessionId, true); // Запускаем без очистки внутри
            } else {
                this.ui.showErrorLobby(res.message || 'Ошибка создания одиночной игры');
            }
        };

        // 2. Сетевая игра: "СТАТЬ ВОЕВОДОЙ"
        this.ui.onCreateLobby = async (arch, weapon) => {
            const token = localStorage.getItem('session_token');
            if (!token) return;
            this.isHost = true;
            
            // Очищаем старые следы до отправки запроса
            this.stateSync.clear();
            this.renderer.reset();
            
            const res = await this.network.createLobby({ token, archetype: arch, weaponId: weapon });
            if (res.success && res.sessionId) {
                this.ui.showStartMatchButton(true);
                this.startGame(res.sessionId, false);
            } else {
                this.ui.showErrorLobby(res.message || 'Ошибка создания лобби');
            }
        };

        // 3. Сетевая игра: "В БОЙ!"
        this.ui.onJoinRoom = async (sid, arch, weapon) => {
            const token = localStorage.getItem('session_token');
            if (!token) return;
            this.isHost = false;
            this.ui.showStartMatchButton(false);
            
            // Очищаем старые следы до отправки запроса
            this.stateSync.clear();
            this.renderer.reset();
            
            const res = await this.network.joinLobby({ sessionId: sid, token, archetype: arch, weaponId: weapon });
            if (res.success) {
                this.startGame(sid, false);
            } else {
                this.ui.showErrorLobby(res.message || 'Не удалось войти в лобби');
            }
        };

        this.ui.onStartMatch = () => {
            if (this.isHost) {
                this.network.sendStartMatch();
                this.ui.showStartMatchButton(false);
            }
        };

        this.network.onRoomInit(roomInit => {
            this.stateSync.setStaticRoom(roomInit);
        });

        this.ui.onLeaveRoom = () => {
            this.network.leaveSession();
            this.stopGame();
        };

        this.ui.onLogout = () => {
            this.network.disconnect();
            localStorage.removeItem('session_token');
            this.ui.showAuth();
        };
    }

    private bindNetworkToApp(): void {
        this.network.onPlayerId(id => this.myId = id);
        this.network.onClassPresets(presets => this.ui.updatePresets(presets));
        
        this.network.onSnapshot(snap => {
            this.stateSync.processSnapshot(snap);
        });

        this.network.onError(msg => {
            alert(`Сервер сообщает: ${msg}`);
            if (msg.includes('другого устройства')) this.ui.onLogout?.();
        });
    }

    private async connectToServer(token: string): Promise<void> {
        try {
            await this.network.connect(token);
            const login = await this.network.requestProfile();
            
            const savedSession = localStorage.getItem('game_session_id');
            if (savedSession) this.startGame(savedSession);
            else this.ui.showLobby(login);
        } catch (e) {
            this.ui.showAuth('Ошибка подключения к игровому серверу');
        }
    }

    private startGame(sessionId: string, isSingleplayer: boolean = false): void {
        localStorage.setItem('game_session_id', sessionId);
        this.ui.showGame(sessionId, isSingleplayer);
        
        this.input.startListening();
        this.input.onInputChanged(action => this.network.sendPlayerAction(action));

        this.lastTime = performance.now();
        this.tick();
    }

    private stopGame(): void {
        localStorage.removeItem('game_session_id');
        this.input.stopListening();
        if (this.gameLoopId) cancelAnimationFrame(this.gameLoopId);
        
        this.network.requestProfile()
            .then(login => this.ui.showLobby(login))
            .catch(() => this.ui.showAuth());
    }

    private tick = (): void => {
        const startTime = performance.now();
        const deltaTime = (startTime - this.lastTime) / 1000;
        this.lastTime = startTime;

        this.stateSync.tickInterpolation(deltaTime);
        
        this.renderer.render(
            this.stateSync.entities, 
            this.stateSync.currentRoomState, 
            this.stateSync.staticObstacles,
            this.myId
        );

        this.gameLoopId = requestAnimationFrame(this.tick);
    }
}

document.addEventListener('DOMContentLoaded', () => new App());