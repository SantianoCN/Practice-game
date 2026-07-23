import Pica from 'pica';
import { VisualEntity } from '../../domain/entities/VisualEntity';
import { RoomState, ChestState, BaseEntityState } from '@game/shared';
import { TextureRenderer, EntityRenderer } from './SupportRenderer';
import { ASSETS } from './../../../assets';
import { GAME_CONFIG } from '@game/shared';

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

    private offscreenCanvas: HTMLCanvasElement;
    private offscreenContext: CanvasRenderingContext2D;
    private currentRoomKey: string = '';

    private playerRenderers: Record<string, EntityRenderer[]>;
    private enemyRenderers: Record<string, EntityRenderer>;
    
    private textures: Record<string, HTMLImageElement | HTMLCanvasElement> = {};
    private tileArr: Array<HTMLImageElement | HTMLCanvasElement> = [];

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

        this.playerRenderers = {
            'Warrior': [new TextureRenderer(ASSETS.hero.warriorSword), new TextureRenderer(ASSETS.hero.warriorAxe)],
            'Mage': [new TextureRenderer(ASSETS.hero.volhvFire), new TextureRenderer(ASSETS.hero.volhvIce)]
        };

        this.enemyRenderers = {
            'red_box': new TextureRenderer(ASSETS.enemy.lizardAxe),
            'orange_box': new TextureRenderer(ASSETS.enemy.lizardMage)
        };

        this.loadAndScaleTexture('chest_closed', ASSETS.env.chest, 28, 28);
        this.loadAndScaleTexture('chest_wooden_closed', ASSETS.env.chest, 28, 28);
        this.loadAndScaleTexture('chest_gold_closed', ASSETS.env.chest, 36, 36);
        this.loadAndScaleTexture('chest_wooden_opened', ASSETS.env.chestOpen, 28, 28);
        this.loadAndScaleTexture('chest_gold_opened', ASSETS.env.chestOpen, 36, 36);
        this.loadAndScaleTexture('stone', ASSETS.env.stone, 20, 20);
        this.loadAndScaleTexture('battle_axe', ASSETS.weapon.battleAxe, 24, 24);
        this.loadAndScaleTexture('iron_sword', ASSETS.weapon.ironSword, 24, 24);
        this.loadAndScaleTexture('fire_staff', ASSETS.weapon.fireStaff, 24, 24);
        this.loadAndScaleTexture('ice_staff', ASSETS.weapon.iceStaff, 24, 24);
        this.loadAndScaleTexture('gold', ASSETS.loot.coin, 24, 24);
        this.loadAndScaleTile(0, ASSETS.env.caveTile1);
        this.loadAndScaleTile(1, ASSETS.env.caveTile2);
        this.loadAndScaleTile(2, ASSETS.env.caveTile3);
        this.loadAndScaleTile(3, ASSETS.env.caveTile4);
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
                this.prerenderStaticScene(room.type, staticObstacles);
            }
        }

        const players = new Map<string, VisualEntity>();
        const enemies = new Map<string, VisualEntity>();
        const bullets = new Map<string, VisualEntity>();

        entitiesMap.forEach((e, id) => {
            if (e.type === 'player') players.set(id, e);
            else if (e.type === 'enemy') enemies.set(id, e);
            else if (e.type === 'bullet') bullets.set(id, e);
        });

        this.drawScreen(players, enemies, bullets, room);
        
        if (!room) return;
        this.updateVisitedRooms(room);
        this.drawGUI(players, myId);
    }

    public reset(): void {
        this.initVisitedMatrix();
        this.currentRoomKey = '';
    }

    private prerenderStaticScene(roomType: string, obstacles: BaseEntityState[]): void {
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
            const texture = this.textures[obstacle.visualId];
            if (texture) {
                const obtacleSize = GAME_CONFIG.CELL_SIZE;
                let repitX = 0;
                let repitY = 0;
                switch (obstacle.visualId) {
                    case 'stone':
                        for (let startX = obstacle.x - obstacle.width / 2; repitX < obstacle.width / obtacleSize; startX += obtacleSize) {
                            repitX++;
                            for (let startY = obstacle.y - obstacle.height / 2; repitY < obstacle.height / obtacleSize; startY += obtacleSize) {
                                repitY++;
                                this.offscreenContext.drawImage(texture, startX, startY, obtacleSize, obtacleSize);
                            }
                            repitY = 0;
                        }
                        break;
                    default:
                        this.offscreenContext.fillStyle = '#d7009a';
                        this.offscreenContext.fillRect(
                            obstacle.x - obstacle.width / 2, 
                            obstacle.y - obstacle.height / 2, 
                            obstacle.width, 
                            obstacle.height
                        );
                        break;
                }
            } else {
                this.offscreenContext.fillStyle = '#d7009a';
                this.offscreenContext.fillRect(
                    obstacle.x - obstacle.width / 2, 
                    obstacle.y - obstacle.height / 2, 
                    obstacle.width, 
                    obstacle.height
                );
            }
        }
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

    private drawGUI(playersMap: Map<string, VisualEntity>, myId: string) {
        const me = playersMap.get(myId);
        if (!me) return;

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
                'staff': 'ПОСОХ ОГНЯ',
                'fire_staff': 'ПОСОХ ОГНЯ',
                'ice_staff': 'ПОСОХ ХЛАДА'
            };
            weaponEl.innerText = weaponNames[me.activeWeaponVisualId] || me.activeWeaponVisualId.toUpperCase();
        }
    }

    private updateHtmlHotbar(me: any, maxSlots: number, activeIdx: number): void {
        const hotbarEl = document.getElementById('hudHotbar');
        if (!hotbarEl) return;

        hotbarEl.innerHTML = '';

        const weaponIcons: Record<string, string> = {
            'iron_sword': ASSETS.weapon.ironSword,
            'battle_axe': ASSETS.weapon.battleAxe,
            'staff': ASSETS.weapon.fireStaff,
            'fire_staff': ASSETS.weapon.fireStaff,
            'ice_staff': ASSETS.weapon.iceStaff
        };

        for (let i = 0; i < maxSlots; i++) {
            const slot = document.createElement('div');
            slot.className = 'hud-slot';
            if (i === activeIdx) {
                slot.classList.add('active');
            }

            const num = document.createElement('span');
            num.className = 'hud-slot-num';
            num.innerText = `${i + 1}`;
            slot.appendChild(num);

            if (me.inventory && me.inventory[i]) {
                const item = me.inventory[i];
                const textureId = typeof item === 'string' 
                    ? item 
                    : (item.visualId || item.presetId || '');

                const imgSrc = weaponIcons[textureId];
                if (imgSrc) {
                    const img = document.createElement('img');
                    img.className = 'hud-slot-icon';
                    img.src = imgSrc;
                    slot.appendChild(img);
                }
            }

            hotbarEl.appendChild(slot);
        }
    }

    private drawScreen(
        playersMap: Map<string, VisualEntity>,
        enemiesMap: Map<string, VisualEntity>,
        bulletsMap: Map<string, VisualEntity>,
        room: RoomState | null
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
        this.drawPlayers(playersMap);
        this.drawEnemies(enemiesMap);
        if (!room) return;
        this.drawMiniMap(room.gridX, room.gridY);
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
            if (bullet.visualId === 'axe_slash') {
                this.drawAxeSlash(bullet, '#e67e22');
                return;
            }

            if (bullet.visualId === 'slash_effect') {
                this.drawSwordSlash(bullet, '#00d2d3');
                return;
            }

            let bulletColor = 'black';
            if (bullet.visualId === 'red_ball') bulletColor = 'red';
            else if (bullet.visualId === 'blue_ball') bulletColor = 'blue';

            this.context.save();
            this.context.beginPath();
            
            const radius = Math.round(bullet.width / 2);
            const bx = Math.round(bullet.renderX);
            const by = Math.round(bullet.renderY);
            
            this.context.arc(bx, by, radius, 0, Math.PI * 2);
            this.context.shadowBlur = 8;
            this.context.shadowColor = bulletColor;
            this.context.fillStyle = bulletColor;
            this.context.fill();
            this.context.restore(); 
        });
    }

    private drawAxeSlash(bullet: VisualEntity, color: string): void {
        const bx = Math.round(bullet.renderX);
        const by = Math.round(bullet.renderY);
        const radius = Math.round(bullet.width);

        const angle = bullet.angle;

        this.context.save();
        this.context.translate(bx, by);
        this.context.rotate(angle);
        this.context.beginPath();
        const arcAngle = Math.PI / 3; 
        this.context.arc(0, 0, radius, -arcAngle, arcAngle, false);
        this.context.arc(0, 0, radius * 0.35, arcAngle, -arcAngle, true);
        this.context.closePath();

        const gradient = this.context.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.context.fillStyle = gradient;
        this.context.shadowBlur = 12;
        this.context.shadowColor = color;
        this.context.fill();

        this.context.restore();
    }

    private drawSwordSlash(bullet: VisualEntity, color: string): void {
        const bx = Math.round(bullet.renderX);
        const by = Math.round(bullet.renderY);
        const slashLength = Math.round(bullet.height || 45);
        const slashWidth = Math.round(bullet.width || 20);

        const angle = bullet.angle;

        this.context.save();
        this.context.translate(bx, by);
        this.context.rotate(angle);
        this.context.beginPath();
        this.context.moveTo(0, -slashLength / 2);
        this.context.quadraticCurveTo(slashWidth, 0, 0, slashLength / 2);
        this.context.quadraticCurveTo(slashWidth * 0.25, 0, 0, -slashLength / 2);
        this.context.closePath();

        this.context.fillStyle = '#ffffff';
        this.context.shadowBlur = 15;
        this.context.shadowColor = color;
        this.context.fill();

        this.context.strokeStyle = color;
        this.context.lineWidth = 2;
        this.context.stroke();

        this.context.restore();
    }

    private drawPlayers(playersMap: Map<string, VisualEntity>): void {
        playersMap.forEach(player => {
            const renders = this.playerRenderers[player.visualId];
            let renderIndex = 0;
            if (player.visualId === 'Warrior') {
                if (player.activeWeaponVisualId === 'battle_axe') {
                    renderIndex = 1;
                }                
            } else if (player.visualId === 'Mage'){
                if (player.activeWeaponVisualId === 'ice_staff') {
                    renderIndex = 1;
                }
            }
            if (renders) renders[renderIndex].draw(this.context, player);
            else this.drawFallback(player);
        });
    }

    private drawEnemies(enemiesMap: Map<string, VisualEntity>): void {
        enemiesMap.forEach(enemy => {
            const renderer = this.enemyRenderers[enemy.visualId];
            if (renderer) renderer.draw(this.context, enemy);
            else this.drawFallback(enemy);
        });
    }

    private drawChests(chests: ChestState[]): void {
        if (!chests || chests.length === 0) return;

        for (const chest of chests) {
            const cx = Math.round(chest.x - chest.width / 2);
            const cy = Math.round(chest.y - chest.height / 2);
            
            const texture = this.textures[chest.visualId];
            if (texture) {
                this.context.drawImage(texture, cx, cy, chest.width, chest.height);
            }
        }
    }

    private drawDroppedItems(droppedItems: BaseEntityState[]): void {
        if (!droppedItems || droppedItems.length === 0) return;

        for (const item of droppedItems) {
            const ix = Math.round(item.x - item.width / 2);
            const iy = Math.round(item.y - item.height / 2);
            const iw = Math.round(item.width);
            const ih = Math.round(item.height);
            
            this.context.save();
            this.context.shadowColor = 'rgba(0, 0, 0, 0.2)';
            this.context.shadowBlur = 5;
            this.context.shadowOffsetX = 1;
            this.context.shadowOffsetY = 2;

            const texture = this.textures[item.visualId];
            if (texture) {
                this.context.drawImage(texture, ix, iy, iw, ih);
            } else {
                this.context.fillStyle = '#0c8a93a4';
                this.context.fillRect(ix, iy, iw, ih);
            }
            this.context.restore();
        }
    }

    private drawFallback(entity: VisualEntity): void {
        this.context.fillStyle = '#ff00ff';
        this.context.fillRect(entity.renderX - entity.width / 2, entity.renderY - entity.height / 2, entity.width, entity.height);
    }
}