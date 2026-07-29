import Pica from 'pica';
import { VisualEntity } from '../../domain/entities/VisualEntity';
import { RoomState, ChestState, BaseEntityState, PortalState } from '@game/shared';
import { TextureRenderer, EntityRenderer } from './SupportRenderer';
import {
    STATIC_ASSET_MANIFEST,
    FLOOR_TILE_ASSETS,
    LIVING_VISUAL_MANIFEST,
    StaticAssetEntry,
} from './asset-manifest.config';
import { GAME_CONFIG } from '@game/shared';
import { ASSETS } from '../../../assets';

interface MapCell {
    state: 'unseen' | 'visible' | 'visited';
    type?: string;
}

const pica = Pica();

export class CanvasRendererAdapter {
    private context: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private visitedMatrix: MapCell[][] = [];
    private readonly matrixSize = GAME_CONFIG.MAP_SIZE;
    private lastHotbarState: string = '';
    public isGuiVisible: boolean = true;
    private offscreenCanvas: HTMLCanvasElement;
    private offscreenContext: CanvasRenderingContext2D;
    private currentRoomKey: string = '';
    private framePlayers = new Map<string, VisualEntity>();
    private frameEnemies = new Map<string, VisualEntity>();
    private frameBullets = new Map<string, VisualEntity>();

    private entityRenderers: Record<string, EntityRenderer> = {};
    private lastGridX: number | null = null;
    private lastGridY: number | null = null;
    private assetSrcMap: Map<string, string> = new Map();
    private textures: Record<string, HTMLImageElement | HTMLCanvasElement> = {};
    public isDebugHitboxesVisible: boolean = false;
    private assetMeta: Record<string, { mode: 'stretch' | 'tiled'; width: number; height: number }> = {};

    private tileArr: Array<HTMLImageElement | HTMLCanvasElement> = [];
    private isHelpVisible: boolean = false;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Cannot get 2D context');
        this.context = ctx;

        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = canvas.width;
        this.offscreenCanvas.height = canvas.height;
        const oCtx = this.offscreenCanvas.getContext('2d');
        if (!oCtx) throw new Error('Cannot get offscreen 2D context');
        this.offscreenContext = oCtx;

        this.context.imageSmoothingEnabled = false;
        this.offscreenContext.imageSmoothingEnabled = false;

        this.initVisitedMatrix();
        this.registerFromManifest();
    }

    public toggleHelp(): void {
        this.isHelpVisible = !this.isHelpVisible;
    }

    public toggleGUI(): void {
        this.isGuiVisible = !this.isGuiVisible;
    }

    private registerFromManifest(): void {
        for (const entry of LIVING_VISUAL_MANIFEST) {
            this.entityRenderers[entry.visualId] = new TextureRenderer(entry.src, entry.idleSrc);
        }

        for (const entry of STATIC_ASSET_MANIFEST) {
            this.registerStaticAsset(entry);
            this.assetSrcMap.set(entry.visualId, entry.src);
        }

        this.loadAndScaleTexture('F1', ASSETS.bubble.F1, this.canvas.width, this.canvas.height);
        FLOOR_TILE_ASSETS.forEach((src, index) => this.loadAndScaleTile(index, src));
    }

    private registerStaticAsset(entry: StaticAssetEntry): void {
        this.assetMeta[entry.visualId] = {
            mode: entry.mode ?? 'stretch',
            width: entry.width,
            height: entry.height,
        };
        this.loadAndScaleTexture(entry.visualId, entry.src, entry.width, entry.height);
    }

    private loadAndScaleTexture(key: string, srcUrl: string, targetWidth: number, targetHeight: number): void {
        const img = new Image();
        img.src = srcUrl;

        img.onload = () => {
            const outCanvas = document.createElement('canvas');
            outCanvas.width = targetWidth;
            outCanvas.height = targetHeight;

            pica.resize(img, outCanvas, { filter: 'lanczos3' })
                .then(() => {
                    this.textures[key] = outCanvas;
                })
                .catch(() => {
                    this.textures[key] = img;
                });
        };

        this.textures[key] = img;
    }

    private loadAndScaleTile(index: number, srcUrl: string): void {
        const img = new Image();
        img.src = srcUrl;

        img.onload = () => {
            const outCanvas = document.createElement('canvas');
            outCanvas.width = GAME_CONFIG.CELL_SIZE;
            outCanvas.height = GAME_CONFIG.CELL_SIZE;
            
            pica.resize(img, outCanvas, { filter: 'lanczos3' })
                .then(() => {
                    this.tileArr[index] = outCanvas;
                })
                .catch(() => {
                    this.tileArr[index] = img;
                });
        };

        this.tileArr[index] = img;
    }

    public render(
        entitiesMap: Map<string, VisualEntity>,
        room: RoomState | null,
        staticObstacles: BaseEntityState[],
        myId: string
    ): void {
        this.clear();

        if (room) {
            const roomKey = `${room.gridX}:${room.gridY}`;

            if (this.currentRoomKey !== roomKey) {
                this.currentRoomKey = roomKey;
                this.prerenderStaticScene(room.obstacles || staticObstacles);
            }
        }

        this.framePlayers.clear();
        this.frameEnemies.clear();
        this.frameBullets.clear();

        entitiesMap.forEach((e, id) => {
            if (e.type === 'player') this.framePlayers.set(id, e);
            else if (e.type === 'enemy') this.frameEnemies.set(id, e);
            else if (e.type === 'bullet') this.frameBullets.set(id, e);
        });

        this.drawScreen(this.framePlayers, this.frameEnemies, this.frameBullets, room, myId);

        if (!room) return;
        this.updateVisitedRooms(room);

        const me = this.framePlayers.get(myId);
        if (me) {
            this.updateHtmlHUD(me);
            if (this.isGuiVisible) {
                this.drawCanvasGUI(me);
                this.drawMiniMap(room.gridX, room.gridY);
            }
        }

        if (this.isDebugHitboxesVisible) {
            this.drawHitboxes(entitiesMap, room, staticObstacles);
        }

        if (this.isHelpVisible) this.drawHelpPage();
    }

    private updateHtmlHUD(me: VisualEntity): void {
        const maxSlots = me.maxInventoryLength ?? (me as any).maxInventoryLenght ?? 3;
        const currentActiveIdx = me.currentWeaponIndex ?? 0;
        
        const inventoryIds = me.inventory 
            ? me.inventory.map((item: any) => typeof item === 'string' ? item : (item.visualId || item.presetId || '')).join(',') 
            : '';

        const currentStateKey = `${maxSlots}_${currentActiveIdx}_${inventoryIds}`;

        if (this.lastHotbarState !== currentStateKey) {
            this.lastHotbarState = currentStateKey;
            this.updateHtmlHotbar(me, maxSlots, currentActiveIdx);
        }

        const goldEl = document.getElementById('hudGold');
        if (goldEl) {
            goldEl.innerText = `${me.gold}`;
        }

        const weaponEl = document.getElementById('hudWeapon');
        if (weaponEl) {
            const weaponNames: Record<string, string> = {
                'iron_sword': 'МЕЧ-КЛАДЕНЕЦ',
                'battle_axe': 'СЕКИРА ПЕРУНА',
                'fire_staff': 'ПОСОХ ОГНЯ',
                'ice_staff': 'ПОСОХ ХЛАДА',
                'lightning_staff': 'ПОСОХ ПЕРУНА',
                'hunter_bow': 'ОХОТНИЧИЙ ЛУК',
            };
            weaponEl.innerText = weaponNames[me.activeWeaponVisualId] || me.activeWeaponVisualId.toUpperCase();
        }
    }

    private drawCanvasGUI(me: VisualEntity): void {
        const px = Math.round(me.renderX);
        const py = Math.round(me.renderY);
        const r = me.width ?? 15;

        this.context.save();
        const arrowY = py - r - 5;
        this.context.fillStyle = '#d4af37';
        this.context.fillRect(px - 5, arrowY, 10, 3);
        this.context.fillRect(px - 3, arrowY + 3, 6, 3);
        this.context.fillRect(px - 1, arrowY + 6, 2, 3);
        this.context.restore();

        const guiX = 20, guiY = 20, guiWidth = 210, guiHeight = 64;
        const hp = me.hp ?? 100, maxHp = me.maxHp ?? 100;
        const mana = me.mana ?? 100, maxMana = me.maxMana ?? 100;

        const hpRatio = Math.max(0, Math.min(1, hp / maxHp));
        const manaRatio = Math.max(0, Math.min(1, mana / maxMana));

        this.context.save();
        this.context.fillStyle = '#1c0e07';
        this.context.fillRect(guiX, guiY, guiWidth, guiHeight);
        this.context.strokeStyle = '#b8860b';
        this.context.lineWidth = 3;
        this.context.strokeRect(guiX, guiY, guiWidth, guiHeight);

        const barX = guiX + 10, barY = guiY + 8, barWidth = guiWidth - 20, barHeight = 16;

        this.context.fillStyle = '#380805';
        this.context.fillRect(barX, barY, barWidth, barHeight);
        this.context.fillStyle = '#8a1c14';
        this.context.fillRect(barX, barY, Math.floor(barWidth * hpRatio), barHeight);
        this.context.strokeStyle = '#120904';
        this.context.lineWidth = 2;
        this.context.strokeRect(barX, barY, barWidth, barHeight);

        this.context.fillStyle = '#f3e5ab';
        this.context.font = '8px "Press Start 2P", monospace';
        this.context.fillText(`ЖИЗНЬ: ${Math.floor(hp)}/${maxHp}`, barX + 6, barY + 11);

        const manaY = barY + 22, manaHeight = 12;
        this.context.fillStyle = '#0a232d';
        this.context.fillRect(barX, manaY, barWidth, manaHeight);
        this.context.fillStyle = '#1a5f7a';
        this.context.fillRect(barX, manaY, Math.floor(barWidth * manaRatio), manaHeight);
        this.context.strokeStyle = '#120904';
        this.context.lineWidth = 2;
        this.context.strokeRect(barX, manaY, barWidth, manaHeight);

        this.context.fillStyle = '#8ad5f0';
        this.context.font = '7px "Press Start 2P", monospace';
        this.context.fillText(`БАЙКАЛ: ${Math.floor(mana)}/${maxMana}`, barX + 6, manaY + 9);
        this.context.restore();

        if (me.canInteracting) {
            this.context.save();
            this.context.font = '8px "Press Start 2P", sans-serif';
            this.context.textAlign = 'center';
            this.context.textBaseline = 'middle';
            this.context.fillStyle = '#ffcc00';
            this.context.fillText('Для взаимодействия - "E"', me.renderX, me.renderY + 20);
            this.context.restore();
        }

        if (me.hp <= 0) {
            this.context.save();
            this.context.fillStyle = 'rgba(0, 0, 0, 0.4)';
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.context.fillStyle = '#e74c3c';
            this.context.font = '14px "Press Start 2P", monospace';
            this.context.textAlign = 'center';
            this.context.fillText('ВЫ ПОГИБЛИ', this.canvas.width / 2, this.canvas.height / 2 - 10);

            this.context.fillStyle = '#ecf0f1';
            this.context.font = '8px "Press Start 2P", monospace';
            this.context.fillText('Ожидайте помощи отряда ...', this.canvas.width / 2, this.canvas.height / 2 + 15);
            this.context.restore();
        }
    }

    public reset(): void {
        this.initVisitedMatrix();
        this.currentRoomKey = '';
        this.lastGridX = null;
        this.lastGridY = null;
    }

    private prerenderStaticScene(obstacles: BaseEntityState[]): void {
        this.offscreenContext.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
        const cellSize = GAME_CONFIG.CELL_SIZE;

        for (let x = 0; x < this.canvas.width; x += cellSize) {
            for (let y = 0; y < this.canvas.width; y += cellSize) {
                const tileNum = Math.floor(Math.random() * this.tileArr.length);
                const tile = this.tileArr[tileNum];
                if (tile) {
                    this.offscreenContext.drawImage(tile, x, y, cellSize, cellSize);
                }
            }
        }

        for (const obstacle of obstacles) {
            this.drawStaticEntity(this.offscreenContext, obstacle);
        }
    }

    private drawStaticEntity(ctx: CanvasRenderingContext2D, entity: BaseEntityState): void {
        const texture = this.textures[entity.visualId];
        if (!texture) {
            ctx.fillStyle = '#d7009a';
            ctx.fillRect(entity.x - entity.width / 2, entity.y - entity.height / 2, entity.width, entity.height);
            return;
        }

        const meta = this.assetMeta[entity.visualId];
        if (meta?.mode === 'tiled') {
            const tileW = meta.width;
            const tileH = meta.height;
            const startX = entity.x - entity.width / 2;
            const startY = entity.y - entity.height / 2;
            const cols = Math.ceil(entity.width / tileW);
            const rows = Math.ceil(entity.height / tileH);
            for (let col = 0; col < cols; col++) {
                for (let row = 0; row < rows; row++) {
                    ctx.drawImage(texture, startX + col * tileW, startY + row * tileH, tileW, tileH);
                }
            }
            return;
        }

        ctx.drawImage(texture, entity.x - entity.width / 2, entity.y - entity.height / 2, entity.width, entity.height);
    }

    private initVisitedMatrix(): void {
        this.visitedMatrix = Array(this.matrixSize).fill(null).map(() =>
            Array(this.matrixSize).fill(null).map(() => ({ state: 'unseen', type: undefined }))
        );
    }

    private updateVisitedRooms(room: RoomState): void {
        const x = room.gridX;
        const y = room.gridY;
        if (x < 0 || x >= this.matrixSize || y < 0 || y >= this.matrixSize) return;

        if (this.lastGridX !== null && this.lastGridY !== null) {
            const distance = Math.abs(x - this.lastGridX) + Math.abs(y - this.lastGridY);
            
            if (room.type === 'Start' && distance > 1) {
                this.initVisitedMatrix();
            }
        }

        this.lastGridX = x;
        this.lastGridY = y;

        this.visitedMatrix[y][x] = { state: 'visited', type: room.type };

        if (room.hasDoors.Top && y > 0) {
            if (this.visitedMatrix[y - 1][x].state === 'unseen') this.visitedMatrix[y - 1][x] = { state: 'visible' };
        }
        if (room.hasDoors.Bottom && y < this.matrixSize - 1) {
            if (this.visitedMatrix[y + 1][x].state === 'unseen') this.visitedMatrix[y + 1][x] = { state: 'visible' };
        }
        if (room.hasDoors.Left && x > 0) {
            if (this.visitedMatrix[y][x - 1].state === 'unseen') this.visitedMatrix[y][x - 1] = { state: 'visible' };
        }
        if (room.hasDoors.Right && x < this.matrixSize - 1) {
            if (this.visitedMatrix[y][x + 1].state === 'unseen') this.visitedMatrix[y][x + 1] = { state: 'visible' };
        }
    }

    private clear(): void {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private updateHtmlHotbar(me: any, maxSlots: number, activeIdx: number): void {
        const hotbarEl = document.getElementById('hudHotbar');
        if (!hotbarEl) return;

        while (hotbarEl.children.length < maxSlots) {
            const slot = document.createElement('div');
            slot.className = 'hud-slot';

            const num = document.createElement('span');
            num.className = 'hud-slot-num';
            num.innerText = `${hotbarEl.children.length + 1}`;
            slot.appendChild(num);

            const img = document.createElement('img');
            img.className = 'hud-slot-icon';
            img.style.display = 'none';
            slot.appendChild(img);

            hotbarEl.appendChild(slot);
        }

        while (hotbarEl.children.length > maxSlots) {
            hotbarEl.removeChild(hotbarEl.lastChild!);
        }

        for (let i = 0; i < maxSlots; i++) {
            const slot = hotbarEl.children[i] as HTMLElement;
            if (!slot) continue;

            slot.classList.toggle('active', i === activeIdx);

            const img = slot.querySelector('img.hud-slot-icon') as HTMLImageElement | null;
            if (!img) continue;

            if (me.inventory && me.inventory[i]) {
                const item = me.inventory[i];
                const textureId = typeof item === 'string' 
                    ? item 
                    : (item.visualId || item.presetId || '');

                const imgSrc = this.assetSrcMap.get(textureId);

                if (imgSrc) {
                    if (img.src !== imgSrc) {
                        img.src = imgSrc;
                    }
                    img.style.display = 'block';
                } else {
                    img.style.display = 'none';
                }
            } else {
                img.style.display = 'none';
            }
        }
    }

    private drawScreen(
        playersMap: Map<string, VisualEntity>,
        enemiesMap: Map<string, VisualEntity>,
        bulletsMap: Map<string, VisualEntity>,
        room: RoomState | null,
        myId: string
    ): void {
        if (room && this.currentRoomKey) {
            this.context.drawImage(this.offscreenCanvas, 0, 0);
            this.drawDoors(room);
        } else {
            this.context.fillStyle = 'white';
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        if (room?.chests) this.drawChests(room.chests);
        if (room?.droppedItems) this.drawDroppedItems(room.droppedItems);
        this.drawBullets(bulletsMap);
        this.drawPlayers(playersMap, myId);
        this.drawEnemies(enemiesMap);
        if (room?.portal && room.portal.isActive) {
            this.drawPortal(room?.portal);
        }
        if (this.isHelpVisible) this.drawHelpPage();
    }

    public drawPortal(portal: PortalState) {
        this.context.save();
        this.context.shadowColor = '#00f0ff';
        this.context.shadowBlur = 15;
        this.context.fillStyle = 'rgba(0, 240, 255, 0.4)';
        this.context.fillRect(portal.x - portal.width / 2, portal.y - portal.height / 2, portal.width, portal.height);
        this.context.strokeStyle = '#ffffff';
        this.context.lineWidth = 2;
        this.context.strokeRect(portal.x - portal.width / 2, portal.y - portal.height / 2, portal.width, portal.height);
        this.context.restore();
    }   

    private drawDoors(room: RoomState): void {
        const doorColor = room.isClear ? '#056111' : '#5c120c';
        this.context.fillStyle = doorColor;

        const doorWidth = GAME_CONFIG.DOOR_SIZE;
        const doorThickness = GAME_CONFIG.DOOR_PADDING;

        if (room.hasDoors.Top) this.context.fillRect(this.canvas.width / 2 - doorWidth / 2, 0, doorWidth, doorThickness);
        if (room.hasDoors.Bottom) this.context.fillRect(this.canvas.width / 2 - doorWidth / 2, this.canvas.height - doorThickness, doorWidth, doorThickness);
        if (room.hasDoors.Left) this.context.fillRect(0, this.canvas.height / 2 - doorWidth / 2, doorThickness, doorWidth);
        if (room.hasDoors.Right) this.context.fillRect(this.canvas.width - doorThickness, this.canvas.height / 2 - doorWidth / 2, doorThickness, doorWidth);
    }

    private drawMiniMap(currentGridX: number, currentGridY: number): void {
        const mapSize = 130, padding = 20;
        const mapX = this.canvas.width - mapSize - padding;
        const mapY = padding;

        this.context.fillStyle = 'rgba(26, 15, 10, 0.95)';
        this.context.fillRect(mapX, mapY, mapSize, mapSize);
        this.context.strokeStyle = 'rgba(184, 134, 11, 0.7)';
        this.context.lineWidth = 3;
        this.context.strokeRect(mapX, mapY, mapSize, mapSize);

        const cellWidth = mapSize / this.matrixSize;
        const cellHeight = mapSize / this.matrixSize;
        const cellPadding = 1.5;

        for (let y = 0; y < this.matrixSize; y++) {
            for (let x = 0; x < this.matrixSize; x++) {
                const cell = this.visitedMatrix[y][x];
                if (cell.state === 'unseen') continue;

                const roomX = mapX + x * cellWidth + cellPadding;
                const roomY = mapY + y * cellHeight + cellPadding;
                const roomW = cellWidth - cellPadding * 2;
                const roomH = cellHeight - cellPadding * 2;

                if (cell.state === 'visited') {
                    let cellColor = '#5c3d24';
                    if (cell.type === 'Start') cellColor = '#2d5a27';
                    if (cell.type === 'Boss') cellColor = '#8a1c14';
                    if (cell.type === 'Treasure') cellColor = '#d4af37';
                    if (cell.type === 'Shop') cellColor = '#1c4966';

                    this.context.fillStyle = cellColor;
                    this.context.fillRect(roomX, roomY, roomW, roomH);

                    if (x === currentGridX && y === currentGridY) {
                        this.context.fillStyle = '#ffffff';
                        const markerSize = roomW / 2;
                        this.context.fillRect(roomX + roomW / 2 - markerSize / 2, roomY + roomH / 2 - markerSize / 2, markerSize, markerSize);
                    }
                } else if (cell.state === 'visible') {
                    this.context.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                    this.context.lineWidth = 1;
                    this.context.strokeRect(roomX, roomY, roomW, roomH);
                }
            }
        }
    }

    private drawBullets(bulletsMap: Map<string, VisualEntity>): void {
        bulletsMap.forEach(bullet => {
            const texture = this.textures[bullet.visualId];
            const meta = this.assetMeta[bullet.visualId];

            if (texture) {
                const bw = meta?.width || bullet.width || 20;
                const bh = meta?.height || bullet.height || 20;
                const angle = bullet.angle;

                this.context.save();
                this.context.translate(Math.round(bullet.renderX), Math.round(bullet.renderY));
                this.context.rotate(angle);
                
                this.context.drawImage(
                    texture, 
                    -Math.round(bw / 2), 
                    -Math.round(bh / 2), 
                    bw, 
                    bh
                );

                this.context.restore();
            } else {
                this.drawFallback(bullet);
            }
        });
    }

    private drawPlayers(playersMap: Map<string, VisualEntity>, myId: string): void {
        playersMap.forEach(player => {
            if (player.name) {
                this.context.save();
                this.context.font = '8px "Press Start 2P", sans-serif';
                this.context.textAlign = 'center';
                this.context.textBaseline = 'middle';
                if (player.id === myId) {
                    this.context.fillStyle = '#ff0000';
                } else {
                    this.context.fillStyle = '#ffcc00';
                }
                this.context.fillText(player.name, player.renderX, player.renderY - 25);
                this.context.restore();
            }

            const renderer = this.entityRenderers[player.visualId];
            if (renderer) {
                const weaponVisualId = player.activeWeaponVisualId;
                const weaponTexture = this.textures[weaponVisualId];
                const weaponMeta = this.assetMeta[weaponVisualId];
                renderer.draw(this.context, player, weaponTexture, weaponMeta);
            } else {
                this.drawFallback(player);
            }
        });
    }

    private drawEnemies(enemiesMap: Map<string, VisualEntity>): void {
        enemiesMap.forEach(enemy => {
            const renderer = this.entityRenderers[enemy.visualId];
            if (renderer) {
                const weaponVisualId = enemy.activeWeaponVisualId;
                const weaponTexture = this.textures[weaponVisualId];
                const weaponMeta = this.assetMeta[weaponVisualId];
                renderer.draw(this.context, enemy, weaponTexture, weaponMeta);
            } else {
                this.drawFallback(enemy);
            }
        });
    }

    private drawChests(chests: ChestState[]): void {
        if (!chests || chests.length === 0) return;
        for (const chest of chests) {
            this.drawStaticEntity(this.context, chest);
        }
    }

    private drawDroppedItems(droppedItems: BaseEntityState[]): void {
        if (!droppedItems || droppedItems.length === 0) return;

        for (const item of droppedItems) {
            this.context.save();
            this.context.shadowColor = 'rgba(0, 0, 0, 0.2)';
            this.context.shadowBlur = 5;
            this.context.shadowOffsetX = 1;
            this.context.shadowOffsetY = 2;

            const texture = this.textures[item.visualId];
            if (texture) {
                this.drawStaticEntity(this.context, item);
            } else {
                const ix = Math.round(item.x - item.width / 2);
                const iy = Math.round(item.y - item.height / 2);
                this.context.fillStyle = '#0c8a93a4';
                this.context.fillRect(ix, iy, Math.round(item.width), Math.round(item.height));
            }
            this.context.restore();
        }
    }

    private drawFallback(entity: VisualEntity): void {
        this.context.fillStyle = '#ff00ff';
        this.context.fillRect(entity.renderX - entity.width / 2, entity.renderY - entity.height / 2, entity.width, entity.height);
    }

    private drawHelpPage(): void {
        const texture = this.textures['F1'];

        if (texture) {
            this.context.drawImage(texture, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.context.fillStyle = 'rgba(0, 0, 0, 0.85)';
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    private drawHitboxes(
        entitiesMap: Map<string, VisualEntity>,
        room: RoomState | null,
        staticObstacles: BaseEntityState[]
    ): void {
        this.context.save();
        this.context.lineWidth = 1;

        this.context.strokeStyle = '#0088ff';
        for (const obs of staticObstacles) {
            this.context.strokeRect(
                Math.round(obs.x - obs.width / 2),
                Math.round(obs.y - obs.height / 2),
                Math.round(obs.width),
                Math.round(obs.height)
            );
        }

        if (room?.chests) {
            this.context.strokeStyle = '#00ffff';
            for (const chest of room.chests) {
                this.context.strokeRect(
                    Math.round(chest.x - chest.width / 2),
                    Math.round(chest.y - chest.height / 2),
                    Math.round(chest.width),
                    Math.round(chest.height)
                );
            }
        }

        if (room?.droppedItems) {
            this.context.strokeStyle = '#00ffff';
            for (const item of room.droppedItems) {
                this.context.strokeRect(
                    Math.round(item.x - item.width / 2),
                    Math.round(item.y - item.height / 2),
                    Math.round(item.width),
                    Math.round(item.height)
                );
            }
        }

        if (room?.portal && room.portal.isActive) {
            this.context.strokeStyle = '#ff00ff';
            const portal = room.portal;
            this.context.strokeRect(
                Math.round(portal.x - portal.width / 2),
                Math.round(portal.y - portal.height / 2),
                Math.round(portal.width),
                Math.round(portal.height)
            );
        }

        entitiesMap.forEach(e => {
            const x = Math.round(e.renderX - e.width / 2);
            const y = Math.round(e.renderY - e.height / 2);
            const w = Math.round(e.width);
            const h = Math.round(e.height);

            if (e.type === 'player') {
                this.context.strokeStyle = '#00ff00';
            } else if (e.type === 'enemy') {
                this.context.strokeStyle = '#ff0000';
            } else if (e.type === 'bullet') {
                this.context.strokeStyle = '#ffff00';
            } else {
                this.context.strokeStyle = '#ffffff';
            }

            this.context.strokeRect(x, y, w, h);

            this.context.fillStyle = this.context.strokeStyle;
            this.context.fillRect(Math.round(e.renderX) - 1, Math.round(e.renderY) - 1, 2, 2);
        });

        this.context.restore();
    }
}