import { DOMManager } from './infrastructure/ui/DOMManager';
import { SocketClient } from './infrastructure/network/SocketClient';
import { KeyboardAdapter } from './infrastructure/input/KeyboardAdapter';
import { CanvasRendererAdapter } from './infrastructure/render/CanvasRendererAdapter';
import { SyncStateUseCase } from './application/use-cases/SyncStateUseCase';
import { BaseResponseDTO, PlayerClassPresetDTO, PlayerProgressDTO } from '@game/shared';

class App {
    private ui = new DOMManager();
    private network = new SocketClient('http://localhost:3000');
    private input = new KeyboardAdapter();
    private renderer: CanvasRendererAdapter;
    private stateSync = new SyncStateUseCase();

    private myId = '';
    private gameLoopId?: number;
    private lastTime = performance.now();
    private isHost = false;
    
    // Кэш данных для обновления списков
    private classPresets: Record<string, PlayerClassPresetDTO> = {};
    private metaProgress?: PlayerProgressDTO;

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
                }).then(r => r.json() as Promise<BaseResponseDTO & { refreshToken?: string; progress?: PlayerProgressDTO }>);

                if (res.success && res.refreshToken) {
                    localStorage.setItem('session_token', res.refreshToken);
                    if (res.progress) {
                        this.metaProgress = res.progress;
                    }
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
            
            this.stateSync.clear();
            this.renderer.reset();
            
            const res = await this.network.createSession({ token, archetype: arch, weaponId: weapon });
            if (res.success && res.sessionId) {
                this.startGame(res.sessionId, true, false); 
            } else {
                this.ui.showErrorLobby(res.message || 'Ошибка создания одиночной игры');
            }
        };

        this.ui.onCreateLobby = async (arch, weapon) => {
            const token = localStorage.getItem('session_token');
            if (!token) return;
            this.isHost = true;
            
            this.stateSync.clear();
            this.renderer.reset();
            
            const res = await this.network.createLobby({ token, archetype: arch, weaponId: weapon });
            if (res.success && res.sessionId) {
                this.ui.showStartMatchButton(true);
                this.startGame(res.sessionId, false, true);
            } else {
                this.ui.showErrorLobby(res.message || 'Ошибка создания лобби');
            }
        };

        this.ui.onJoinRoom = async (sid, arch, weapon) => {
            const token = localStorage.getItem('session_token');
            if (!token) return;
            this.isHost = false;
            this.ui.showStartMatchButton(false);
            
            this.stateSync.clear();
            this.renderer.reset();
            
            const res = await this.network.joinLobby({ sessionId: sid, token, archetype: arch, weaponId: weapon });
            if (res.success) {
                this.startGame(sid, false, false);
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

        this.ui.onBuyItem = async (presetId) => {
            try {
                const res = await this.network.buyItem(presetId);
                if (res.success && res.progress) {
                    this.metaProgress = res.progress;
                    this.ui.updatePresets(this.classPresets, res.progress);
                } else {
                    alert(res.message || 'Не удалось купить предмет');
                }
            } catch (err) {
                alert('Ошибка отправки запроса покупки');
            }
        };

        this.ui.onCompleteSession = async () => {
            try {
                const res = await this.network.completeSession();
                if (res.success) {
                    // Выход из сессии произойдет автоматически через событие onSessionCompleted
                } else {
                    alert(res.message || 'Не удалось завершить поход');
                }
            } catch (err) {
                alert('Ошибка соединения при завершении похода');
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
        
        this.network.onClassPresets(presets => {
            this.classPresets = presets;
            this.ui.updatePresets(presets, this.metaProgress);
        });
        
        this.network.onSnapshot(snap => {
            this.stateSync.processSnapshot(snap);
        });

        this.network.onError(msg => {
            alert(`Сервер сообщает: ${msg}`);
            if (msg.includes('другого устройства')) this.ui.onLogout?.();
        });
 
        // ШАГ 2+: Фоновая автоматическая синхронизация прогресса с сервером
        this.network.onSyncProgress(progress => {
            this.metaProgress = progress;
            this.ui.updatePresets(this.classPresets, progress);
        });

        // Слушаем сигнал успешного завершения забега (сохранение золота в БД и выход)
        this.ui.onCompleteSession = async () => {
            try {
                const res = await this.network.completeSession();
                if (res.success) {
                    // Если сервер вернул обновленный прогресс прямо в ответе (для одиночной игры)
                    if (res.progress) {
                        this.metaProgress = res.progress;
                        this.ui.updatePresets(this.classPresets, res.progress);
                    }
                    this.stopGame();
                } else {
                    alert(res.message || 'Не удалось завершить поход');
                }
            } catch (err) {
                alert('Ошибка соединения при завершении похода');
            }
        };

        // Слушаем принудительное отключение сессии (например, хост закрыл игру)
        this.network.onSessionTerminated(data => {
            alert(data.message);
            this.stopGame();
        });
    }

    private async connectToServer(token: string): Promise<void> {
        try {
            const profile = await this.network.connect(token);
            
            if (profile.progress) {
                this.metaProgress = profile.progress;
            }

            const savedSession = localStorage.getItem('game_session_id');
            if (savedSession) {
                this.startGame(savedSession, false, false);
            } else {
                this.ui.showLobby(profile.login);
                this.ui.updatePresets(this.classPresets, this.metaProgress);
            }
        } catch (e) {
            this.ui.showAuth('Ошибка подключения к игровому серверу');
        }
    }

    private startGame(sessionId: string, isSingleplayer: boolean = false, isHost: boolean = false): void {
        localStorage.setItem('game_session_id', sessionId);
        this.ui.showGame(sessionId, isSingleplayer, isHost); // Передаем флаги
        
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
            .then(profile => {
                if (profile.progress) {
                    this.metaProgress = profile.progress;
                }
                this.ui.showLobby(profile.login);
                this.ui.updatePresets(this.classPresets, this.metaProgress);
            })
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