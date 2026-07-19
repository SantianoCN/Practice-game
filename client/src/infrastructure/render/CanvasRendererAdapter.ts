import { VisualEntity } from '../../domain/entities/VisualEntity';
import { RoomState, ChestState, BaseEntityState } from '@game/shared';
import { TextureRenderer, EntityRenderer } from './SupportRenderer';
import { GAME_CONFIG } from '@game/shared';

import warriorImgUrl from './../../../assets/hero/warrior-sword-anim.png'; 
import volhvImgUrl from './../../../assets/hero/volhv.png'; 
import lizardAxeImgUrl from './../../../assets/enemy/lizard-axe.png';
import lizardMageImgUrl from './../../../assets/enemy/lizard-mage.png';
import coinImgUrl from './../../../assets/loot/coin.png'
import battleAxeImgUrl from './../../../assets/weapon/axe.png';
import ironSwordImgUrl from './../../../assets/weapon/sword.png';
import fireStaffImgUrl from './../../../assets/weapon/fire_staff.png';
import iceStaffImgUrl from './../../../assets/weapon/ice_staff.png';
import chestImgUrl from '../../../assets/chest.png';
import chestOpenImgUrl from '../../../assets/chest-open.png';

interface MapCell {
    state: 'unseen' | 'visible' | 'visited';
    type?: string;
}

export class CanvasRendererAdapter {
    private context: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private visitedMatrix: MapCell[][] = [];
    private readonly matrixSize = 10;

    private playerRenderers: Record<string, EntityRenderer>;
    private enemyRenderers: Record<string, EntityRenderer>;
    private textures: Record<string, HTMLImageElement> = {};

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Cannot get 2D context');
        this.initVisitedMatrix();
        this.context = ctx;

        this.playerRenderers = {
            'Warrior': new TextureRenderer(warriorImgUrl),
            'Mage': new TextureRenderer(volhvImgUrl)
        };

        this.enemyRenderers = {
            'red_box': new TextureRenderer(lizardAxeImgUrl),
            'orange_box': new TextureRenderer(lizardMageImgUrl)
        };

        this.textures = {
            'chest': this.preloadImage(chestImgUrl),
            'chestOpen': this.preloadImage(chestOpenImgUrl),
            'battle_axe': this.preloadImage(battleAxeImgUrl),
            'iron_sword': this.preloadImage(ironSwordImgUrl),
            'fire_staff': this.preloadImage(fireStaffImgUrl),
            'ice_staff': this.preloadImage(iceStaffImgUrl),
            'gold': this.preloadImage(coinImgUrl)
        };
    }

    private preloadImage(src: string): HTMLImageElement {
        const img = new Image();
        img.src = src;
        return img;
    }

    public render(entitiesMap: Map<string, VisualEntity>, room: RoomState | null, myId: string): void {
        this.clear();
        
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

        this.drawDebugHitboxes(entitiesMap, room); 
    }

    public reset(): void {
        this.initVisitedMatrix();
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
                'ice_staff': 'ПОСОХ ХЛАДА'
            };
            weaponEl.innerText = weaponNames[me.activeWeaponVisualId] || me.activeWeaponVisualId.toUpperCase();
        }
    }

    private drawScreen(
        playersMap: Map<string, VisualEntity>,
        enemiesMap: Map<string, VisualEntity>,
        bulletsMap: Map<string, VisualEntity>,
        room: RoomState | null
    ): void {
        this.drawMap(room);
        this.drawObstacles(room?.obstacles ?? []);
        if (room?.chests) this.drawChests(room.chests);
        if (room?.droppedItems) this.drawDroppedItems(room.droppedItems);
        this.drawBullets(bulletsMap);
        this.drawPlayers(playersMap);
        this.drawEnemies(enemiesMap);
        if (!room) return;
        this.drawMiniMap(room.gridX, room.gridY);
    }

    private drawMap(room: RoomState | null): void {
        if (!room) {
            this.context.fillStyle = 'white';
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }

        let floorColor = '#3c2415';
        if (room.type === 'Start') floorColor = '#4a2f1b';
        if (room.type === 'Boss') floorColor = '#3a0d0a';
        if (room.type === 'Treasure') floorColor = '#5c4314';
        if (room.type === 'Shop') floorColor = '#1e2b30';

        this.context.fillStyle = floorColor;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const doorColor = room.isClear ? '#b8860b' : '#5c120c'; 
        this.context.fillStyle = doorColor;

        const doorWidth = 100;
        const doorThickness = 15;

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
            let bulletColor = 'black';
            if (bullet.visualId === 'red_ball') bulletColor = 'red';
            else if (bullet.visualId === 'blue_ball') bulletColor = 'blue';

            this.context.save();
            this.context.beginPath();
            const radius = Math.round(bullet.width / 2);
            this.context.arc(Math.round(bullet.renderX - bullet.width / 2), Math.round(bullet.renderY - bullet.height / 2), radius, 0, Math.PI * 2);
            this.context.shadowBlur = 8;
            this.context.shadowColor = bulletColor;
            this.context.fillStyle = bulletColor;
            this.context.fill();
            this.context.restore(); 
        });
    }

    private drawPlayers(playersMap: Map<string, VisualEntity>): void {
        playersMap.forEach(player => {
            const renderer = this.playerRenderers[player.visualId];
            if (renderer) renderer.draw(this.context, player);
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

    private drawObstacles(obstacles: BaseEntityState[]): void {
        for (const obstacle of obstacles) {
            this.context.fillStyle = 'black';
            this.context.fillRect(obstacle.x - obstacle.width / 2, obstacle.y - obstacle.height / 2, obstacle.width, obstacle.height);
        }
    }

    private drawChests(chests: ChestState[]): void {
        if (!chests || chests.length === 0) return;

        for (const chest of chests) {
            const x = chest.x - chest.width / 2;
            const y = chest.y - chest.height / 2;
            const texture = this.textures[chest.visualId];
            this.context.drawImage(texture, x, y , chest.width, chest.height);
        }
    }

    private drawDroppedItems(droppedItems: BaseEntityState[]): void {
        if (!droppedItems || droppedItems.length === 0) return;

        for (const item of droppedItems) {
            const x = item.x - item.width / 2, y = item.y - item.height / 2;
            const w = item.width, h = item.height;
            
            this.context.shadowColor = 'rgba(0, 0, 0, 0.2)';
            this.context.shadowBlur = 5;
            this.context.shadowOffsetX = 1;
            this.context.shadowOffsetY = 2;

            const texture = this.textures[item.visualId];

            if (texture) {
                this.context.drawImage(texture, x, y, w, h);
            } else {
                this.context.fillStyle = '#0c8a93a4';
                this.context.fillRect(x, y, w, h);
            }
            console.log(item.visualId)
        }
    }

    private drawFallback(entity: VisualEntity): void {
        this.context.fillStyle = '#ff00ff';
        this.context.fillRect(entity.renderX - entity.width / 2, entity.renderY - entity.height / 2, entity.width, entity.height);
    }

    public drawDebugHitboxes(entitiesMap: Map<string, VisualEntity>, room: RoomState | null): void {
        this.context.save();
        this.context.lineWidth = 1;

        entitiesMap.forEach(entity => {
            if (entity.isDying) return;

            let color = '#00ff00';
            if (entity.type === 'enemy') color = '#ff0000';
            if (entity.type === 'bullet') color = '#ffff00';

            this.context.strokeStyle = color;
            this.context.strokeRect(
                Math.round(entity.renderX - entity.width / 2),
                Math.round(entity.renderY - entity.height / 2),
                entity.width,
                entity.height
            );
        });

        if (room) {
            if (room.obstacles) {
                this.context.strokeStyle = '#0000ff';
                room.obstacles.forEach(obs => {
                    this.context.strokeRect(
                        Math.round(obs.x - obs.width / 2),
                        Math.round(obs.y - obs.height / 2),
                        obs.width,
                        obs.height
                    );
                });
            }

            if (room.chests) {
                this.context.strokeStyle = '#ff00ff';
                room.chests.forEach(chest => {
                    const x = chest.x;
                    const y = chest.y;
                    this.context.strokeRect(
                        Math.round(x - chest.width / 2),
                        Math.round(y - chest.height / 2),
                        chest.width,
                        chest.height
                    );
                });
            }

            if (room.droppedItems) {
                this.context.strokeStyle = '#00ffff';
                room.droppedItems.forEach(item => {
                    this.context.strokeRect(
                        Math.round(item.x - item.width / 2),
                        Math.round(item.y - item.height / 2),
                        item.width,
                        item.height
                    );
                });
            }
        }

        this.context.restore();
    }
}