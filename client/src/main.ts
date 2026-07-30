import { DOMManager } from './infrastructure/ui/DOMManager';
import { SocketClient } from './infrastructure/network/SocketClient';
import { KeyboardAdapter } from './infrastructure/input/KeyboardAdapter';
import { CanvasRendererAdapter } from './infrastructure/render/CanvasRendererAdapter';
import { SyncStateUseCase } from './application/use-cases/SyncStateUseCase';
import { audio } from './infrastructure/render/SoundRender';
import { BaseResponseDTO, PlayerClassPresetDTO, PlayerProgressDTO } from '@game/shared';

const SERVER_URL = 'http://localhost:3000';

class App {
    private ui = new DOMManager();
    private network = new SocketClient(SERVER_URL);
    private input = new KeyboardAdapter();
    private renderer: CanvasRendererAdapter;
    private stateSync = new SyncStateUseCase();

    private myId = '';
    private gameLoopId?: number;
    private lastTime = performance.now();
    private isHost = false;
    private classPresets: Record<string, PlayerClassPresetDTO> = {};
    private metaProgress?: PlayerProgressDTO;

    constructor() {
        const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.renderer = new CanvasRendererAdapter(canvas);
        this.input.onToggleGuiReq = () => {
            this.renderer.toggleGUI();
        };

        this.input.onHelpPressed(() => this.renderer.toggleHelp());

        this.bindUiToNetwork();
        this.bindNetworkToApp();
        this.init();
        audio.initSound()
    }

    private async init(): Promise<void> {
        try {
            const check = await this.network.checkAuth();
            if (check.success && check.authenticated) {
                this.connectToServer(check);
            } else {
                this.ui.showAuth();
            }
        } catch (e) {
            this.ui.showAuth();
        }
    }

    private bindUiToNetwork(): void {
        this.ui.onAuthReq = async (action, login, password) => {
            const url = `${SERVER_URL}/${action}`;
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ login, password })
                }).then(r => r.json() as Promise<BaseResponseDTO>);

                if (res.success) {
                    const check = await this.network.checkAuth();
                    if (check.success && check.authenticated) {
                        this.connectToServer(check);
                    }
                } else {
                    this.ui.showAuth(res.message);
                }
            } catch (e) {
                this.ui.showAuth('Сервер недоступен (Connection Refused)');
            }
        };

        this.ui.onCreateRoom = async (arch, weapon) => {
            this.isHost = true;
            this.ui.showStartMatchButton(false);

            this.stateSync.clear();
            this.renderer.reset();

            const res = await this.network.createSession({ archetype: arch, weaponId: weapon });
            if (res.success && res.sessionId) {
                this.startGame(res.sessionId, true, true);
            } else {
                this.ui.showErrorLobby(res.message || 'Ошибка создания одиночной игры');
            }
        };

        this.ui.onCreateLobby = async (arch, weapon) => {
            this.isHost = true;

            this.stateSync.clear();
            this.renderer.reset();

            const res = await this.network.createLobby({ archetype: arch, weaponId: weapon });
            if (res.success && res.sessionId) {
                this.ui.showStartMatchButton(true);
                this.startGame(res.sessionId, false, true);
            } else {
                this.ui.showErrorLobby(res.message || 'Ошибка создания лобби');
            }
        };

        this.ui.onRestoreSave = async () => {
            this.stateSync.clear();
            this.renderer.reset();

            try {
                const res = await this.network.restoreSave();
                if (res.success && res.sessionId) {
                    if (res.isSingleplayer) {
                        this.isHost = true;
                        this.ui.showStartMatchButton(false);
                        this.startGame(res.sessionId, true, true);
                    } else {
                        this.isHost = true;
                        this.ui.showStartMatchButton(true);
                        this.startGame(res.sessionId, false, true);
                    }
                } else {
                    this.ui.showErrorLobby(res.message || 'Не удалось продолжить поход');
                }
            } catch (err) {
                this.ui.showErrorLobby('Ошибка отправки запроса продолжения');
            }
        };

        this.ui.onPortalNextFloor = () => {
            this.network.sendNextFloor();
            this.ui.showPortalModal(false);
            this.stateSync.clear();
        };

        this.ui.onPortalSaveAndExit = async () => {
            try {
                const res = await this.network.saveAndExit();
                if (res.success) {
                    this.ui.showPortalModal(false);
                    this.ui.showToast('Поход успешно сохранен!', 'success');
                } else {
                    this.ui.showToast(res.message || 'Не удалось сохранить поход', 'error');
                }
            } catch (err) {
                this.ui.showToast('Ошибка соединения с избой', 'error');
            }
        };

        this.ui.onJoinRoom = async (sid, arch, weapon) => {
            this.isHost = false;
            this.ui.showStartMatchButton(false);

            this.stateSync.clear();
            this.renderer.reset();

            const res = await this.network.joinLobby({ sessionId: sid, archetype: arch, weaponId: weapon });
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
                    this.ui.showToast('Разблокировка успешна!', 'success');
                } else {
                    this.ui.showToast(res.message || 'Не удалось купить предмет', 'error');
                }
            } catch (err) {
                this.ui.showToast('Ошибка отправки запроса покупки', 'error');
            }
        };

        this.ui.onLeaveRoom = () => {
            this.network.leaveSession();
            this.stopGame();
        };

        this.ui.onLogout = async () => {
            if (this.gameLoopId) {
                cancelAnimationFrame(this.gameLoopId);
                this.gameLoopId = undefined;
            }
            this.input.stopListening();
            this.ui.showPortalModal(false);
            this.ui.resetState();
            this.stateSync.clear();
            this.renderer.reset();

            try {
                await fetch(`${SERVER_URL}/logout`, {
                    method: 'POST',
                    credentials: 'include'
                });
            } catch (e) {}

            this.network.disconnect();
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
            this.ui.showToast(`Сервер: ${msg}`, 'info');
            if (msg.includes('другого устройства') || msg.includes('недействительна')) {
                this.ui.onLogout?.();
            }
        });

        this.network.onSyncProgress(progress => {
            this.metaProgress = progress;
            this.ui.updatePresets(this.classPresets, progress);
        });

        this.network.onSessionCompleted(data => {
            if (data.progress) {
                this.metaProgress = data.progress;
                this.ui.updatePresets(this.classPresets, data.progress);
            }
            this.ui.showToast(data.message, 'success');
            this.stopGame();
        });

        this.ui.onCompleteSession = async () => {
            try {
                const res = await this.network.completeSession();
                if (!res.success) {
                    this.ui.showToast(res.message || 'Не удалось завершить поход', 'error');
                }
            } catch (err) {
                this.ui.showToast('Ошибка соединения при завершении похода', 'error');
            }
        };

        this.network.onPortalInteract(() => {
            this.ui.showPortalModal(true);
        });

        this.network.onHostMigrated(data => {
            if (data.newHostAccountId === this.myId) {
                this.isHost = true;
                this.ui.updateHostStatus(true);
                this.ui.showToast('Вы назначены новым воеводой отряда!', 'success');
            }
        });

        this.network.onGameOver(() => {
            this.ui.showGameOverModal(true, this.isHost);
            this.ui.updateHostStatus(this.isHost);
        });

        this.network.onSessionTerminated(data => {
            this.ui.showToast(data.message, 'info');
            this.stopGame();
        });
    }

    private async connectToServer(checkData: any): Promise<void> {
        try {
            await this.network.connect();
        } catch (e) {
            console.error('[connectToServer] network.connect failed:', e);
            this.ui.showAuth('Ошибка подключения к игровому серверу');
            return;
        }

        if (checkData.progress) {
            this.metaProgress = checkData.progress;
        }

        if (checkData.message) {
            this.ui.showToast(checkData.message, 'info');
        }

        if (checkData.currentSessionId) {
            this.isHost = checkData.isHost === true;
            this.ui.showStartMatchButton(this.isHost && !checkData.isSingleplayer);
            this.startGame(checkData.currentSessionId, !!checkData.isSingleplayer, this.isHost);
            return;
        }

        this.ui.showLobby(checkData.login);
        this.ui.updatePresets(this.classPresets, this.metaProgress);
        this.ui.showContinueButton(!!checkData.activeSaveSessionId);
        audio.playSound('house', 'envMusic')
    }

    private startGame(sessionId: string, isSingleplayer: boolean = false, isHost: boolean = false): void {
        this.ui.showGame(sessionId, isSingleplayer, isHost);

        this.input.startListening();
        this.input.onInputChanged(action => this.network.sendPlayerAction(action));
        audio.stopSound('house')
        audio.playSound('envMusic', 'envMusic');

        this.lastTime = performance.now();
        this.tick();
    }

    private stopGame(): void {
        this.input.stopListening();
        this.ui.showPortalModal(false);
        this.ui.showGameOverModal(false);
        if (this.gameLoopId) cancelAnimationFrame(this.gameLoopId);
        this.stateSync.clear();
        this.renderer.reset();
        audio.stopSound('envMusic');

        this.network.checkAuth()
            .then(check => {
                if (check.progress) {
                    this.metaProgress = check.progress;
                }
                if (check.login) {
                    this.ui.showLobby(check.login);
                    this.ui.updatePresets(this.classPresets, this.metaProgress);
                    this.ui.showContinueButton(!!check.activeSaveSessionId);
                    audio.playSound('house', 'envMusic')
                } else {
                    this.ui.showAuth();
                }
            })
            .catch(() => this.ui.showAuth());
    }

    private tick = (): void => {
        const startTime = performance.now();
        const deltaTime = (startTime - this.lastTime) / 1000;
        this.lastTime = startTime;

        this.gameLoopId = requestAnimationFrame(this.tick);

        this.stateSync.tickInterpolation(deltaTime);
        this.renderer.render(
            this.stateSync.entities,
            this.stateSync.currentRoomState,
            this.stateSync.staticObstacles,
            this.myId
        );
    }
}

document.addEventListener('DOMContentLoaded', () => new App());