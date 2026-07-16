import { VisualEntity } from '../../domain/entities/VisualEntity';
import { RoomSnapshotDTO, ChestSnapshotDTO, BaseNetworkEntityDTO } from '@game/shared';
import { TextureRenderer, EntityRenderer, BoxRenderer } from './SupportRenderer';

import warriorImgUrl from '../../../assets/Warrior.png';
import mageImgUrl from '../../../assets/Mage.png';

interface MapCell {
    state: 'unseen' | 'visible' | 'visited';
    type?: string;
}
export class CanvasRendererAdapter {
    // ... оригинальный код конструктора и переменных ...
    private context: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private visitedMatrix: MapCell[][] = [];
    private readonly matrixSize = 10;
    private playerRenderers: Record<string, EntityRenderer>;
    private enemyRenderers: Record<string, EntityRenderer>;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Cannot get 2D context');
        this.initVisitedMatrix();
        this.context = ctx;

        this.playerRenderers = {
            'Warrior': new TextureRenderer(warriorImgUrl),
            'green_box': new TextureRenderer(warriorImgUrl),
            'Mage': new TextureRenderer(mageImgUrl)
        };

        this.enemyRenderers = {
            'red_box': new BoxRenderer('red'),
            'orange_box': new BoxRenderer('orange')
        };
    }

    public render(entitiesMap: Map<string, VisualEntity>, room: RoomSnapshotDTO | null, myId: string): void {
        // ... оригинальный код ...
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
    }

    public reset(): void {
        this.initVisitedMatrix();
    }

    private initVisitedMatrix(): void {
        this.visitedMatrix = Array(this.matrixSize).fill(null).map(() =>
            Array(this.matrixSize).fill(null).map(() => ({ state: 'unseen', type: undefined }))
        );
    }

    private updateVisitedRooms(room: RoomSnapshotDTO): void {
        // ... оригинальный код ...
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

        const px = me.renderX;
        const py = me.renderY;
        const r = me.width ?? 15;

        // Стрелка над игроком
        this.context.save();
        const arrowY = py - r - 16;
        this.context.fillStyle = '#d4af37';
        this.context.fillRect(px - 5, arrowY, 10, 3);
        this.context.fillRect(px - 3, arrowY + 3, 6, 3);
        this.context.fillRect(px - 1, arrowY + 6, 2, 3);
        this.context.restore();

        // Полосы HP и Маны (Верхний левый угол)
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
        
        // Золото и Оружие (Нижний левый угол)
        const bottomY = this.canvas.height - 60;
        
        this.context.fillStyle = '#1c0e07';
        this.context.fillRect(20, bottomY, 140, 40);
        this.context.strokeStyle = '#b8860b';
        this.context.strokeRect(20, bottomY, 140, 40);
        
        this.context.fillStyle = '#f1c40f';
        this.context.font = '10px "Press Start 2P", monospace';
        this.context.fillText(`ЗОЛОТО: ${me.gold}`, 30, bottomY + 25);

        this.context.fillStyle = '#1c0e07';
        this.context.fillRect(170, bottomY, 260, 40);
        this.context.strokeStyle = '#b8860b';
        this.context.strokeRect(170, bottomY, 260, 40);

        const weaponNames: Record<string, string> = {
            'iron_sword': 'МЕЧ-КЛАДЕНЕЦ',
            'battle_axe': 'СЕКИРА ПЕРУНА',
            'staff': 'ПОСОХ ОГНЯ',
            'ice_staff': 'ПОСОХ ХЛАДА'
        };
        const weaponName = weaponNames[me.activeWeaponSprite] || me.activeWeaponSprite.toUpperCase();

        this.context.fillStyle = '#bdc3c7';
        this.context.fillText(`ОРУЖИЕ: ${weaponName}`, 180, bottomY + 25);
        
        this.context.restore();
    }

    private drawScreen(
        playersMap: Map<string, VisualEntity>,
        enemiesMap: Map<string, VisualEntity>,
        bulletsMap: Map<string, VisualEntity>,
        room: RoomSnapshotDTO | null
    ): void {
        // ... оригинальный код ...
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

    private drawMap(room: RoomSnapshotDTO | null): void {
        // ... оригинальный код ...
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
        // ... оригинальный код ...
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
        // ... оригинальный код ...
        bulletsMap.forEach(bullet => {
            let bulletColor = 'black';
            if (bullet.sprite === 'red_ball') bulletColor = 'red';
            else if (bullet.sprite === 'blue_ball') bulletColor = 'blue';

            this.context.save();
            this.context.beginPath();
            const radius = bullet.width / 2;
            this.context.arc(bullet.renderX, bullet.renderY, radius, 0, Math.PI * 2);
            this.context.shadowBlur = 8;
            this.context.shadowColor = bulletColor;
            this.context.fillStyle = bulletColor;
            this.context.fill();
            this.context.restore(); 
        });
    }

    private drawPlayers(playersMap: Map<string, VisualEntity>): void {
        // ... оригинальный код ...
        playersMap.forEach(player => {
            const renderer = this.playerRenderers[player.sprite];
            if (renderer) renderer.draw(this.context, player);
            else this.drawFallback(player);
        });
    }

    private drawEnemies(enemiesMap: Map<string, VisualEntity>): void {
        // ... оригинальный код ...
        enemiesMap.forEach(enemy => {
            const renderer = this.enemyRenderers[enemy.sprite];
            if (renderer) renderer.draw(this.context, enemy);
            else this.drawFallback(enemy);
        });
    }

    private drawObstacles(obstacles: BaseNetworkEntityDTO[]): void {
        // ... оригинальный код ...
        for (const obstacle of obstacles) {
            this.context.fillStyle = 'black';
            this.context.fillRect(obstacle.x - obstacle.width / 2, obstacle.y - obstacle.height / 2, obstacle.width, obstacle.height);
        }
    }

    private drawChests(chests: ChestSnapshotDTO[]): void {
        // ... оригинальный код ...
        if (!chests || chests.length === 0) return;
        const cellSize = 20;

        for (const chest of chests) {
            const x = chest.gridX * cellSize;
            const y = chest.gridY * cellSize;
            const w = cellSize, h = cellSize;
            const isOpened = chest.isOpened || false;

            this.context.shadowColor = 'rgba(0, 0, 0, 0.25)';
            this.context.shadowBlur = 8;
            this.context.shadowOffsetX = 2;
            this.context.shadowOffsetY = 2;

            this.context.fillStyle = isOpened ? '#8B7D3C' : '#E67E22';
            this.context.fillRect(x, y, w, h);

            this.context.shadowColor = 'transparent';
            this.context.shadowBlur = 0;
            this.context.shadowOffsetX = 0;
            this.context.shadowOffsetY = 0;

            this.context.strokeStyle = isOpened ? '#5C4A2A' : '#8B5A00';
            this.context.lineWidth = 1;
            this.context.strokeRect(x, y, w, h);

            this.context.strokeStyle = isOpened ? '#7A6B3A' : '#CC7A00';
            this.context.lineWidth = 0.5;

            for (let i = 1; i < 3; i++) {
                const lineY = y + (h * i) / 3;
                this.context.beginPath();
                this.context.moveTo(x + 2, lineY);
                this.context.lineTo(x + w - 2, lineY);
                this.context.stroke();
            }

            this.context.beginPath();
            this.context.moveTo(x + w / 2, y + 2);
            this.context.lineTo(x + w / 2, y + h - 2);
            this.context.stroke();

            if (!isOpened) {
                this.context.fillStyle = '#D35400';
                this.context.beginPath();
                this.context.moveTo(x + 2, y);
                this.context.lineTo(x + w / 2, y - 3);
                this.context.lineTo(x + w - 2, y);
                this.context.closePath();
                this.context.fill();
                this.context.strokeStyle = '#8B5A00';
                this.context.lineWidth = 0.8;
                this.context.stroke();

                this.context.fillStyle = '#DAA520';
                this.context.fillRect(x + 3, y - 1, 2, 2);
                this.context.fillRect(x + w - 5, y - 1, 2, 2);

                this.context.fillStyle = '#F1C40F';
                this.context.fillRect(x + w / 2 - 3, y + h / 2 - 3, 6, 5);
                this.context.fillStyle = '#DAA520';
                this.context.fillRect(x + w / 2 - 1, y + h / 2 - 5, 2, 3);
                this.context.fillStyle = '#4A3520';
                this.context.fillRect(x + w / 2 - 1, y + h / 2 - 1, 2, 1);
            } else {
                this.context.fillStyle = '#6B5D2C';
                this.context.beginPath();
                this.context.moveTo(x + 2, y - 1);
                this.context.lineTo(x + w / 2, y - 5);
                this.context.lineTo(x + w - 2, y - 1);
                this.context.closePath();
                this.context.fill();
                this.context.strokeStyle = '#4A3520';
                this.context.lineWidth = 0.8;
                this.context.stroke();

                this.context.fillStyle = '#3D2B1F';
                this.context.fillRect(x + 2, y + 2, w - 4, h - 4);
                this.context.fillStyle = 'rgba(255, 215, 0, 0.15)';
                this.context.fillRect(x + 3, y + 3, w - 6, h - 6);

                this.context.fillStyle = '#8B7D3C';
                this.context.fillRect(x + w - 4, y + h / 2 - 2, 3, 3);
                this.context.fillStyle = '#A0926B';
                this.context.fillRect(x + w - 2, y + h / 2 - 1, 1, 5);
            }
        }
    }

    private drawDroppedItems(droppedItems: BaseNetworkEntityDTO[]): void {
        // ... оригинальный код ...
        if (!droppedItems || droppedItems.length === 0) return;

        for (const item of droppedItems) {
            const x = item.x - item.width / 2, y = item.y - item.height / 2;
            const w = item.width, h = item.height;

            this.context.shadowColor = 'rgba(0, 0, 0, 0.2)';
            this.context.shadowBlur = 5;
            this.context.shadowOffsetX = 1;
            this.context.shadowOffsetY = 2;

            let color = '#95A5A6', glowColor = 'rgba(0, 0, 0, 0)';
            if (item.sprite === 'sword' || item.sprite === 'weapon') { color = '#E74C3C'; glowColor = 'rgba(231, 76, 60, 0.2)'; }
            else if (item.sprite === 'gold') { color = '#F1C40F'; glowColor = 'rgba(241, 196, 15, 0.2)'; }

            if (glowColor !== 'rgba(0, 0, 0, 0)') {
                this.context.fillStyle = glowColor;
                this.context.beginPath();
                this.context.arc(item.x, item.y, Math.max(w, h) * 1.2, 0, Math.PI * 2);
                this.context.fill();
            }

            this.context.fillStyle = color;
            this.context.fillRect(x, y, w, h);

            this.context.shadowColor = 'transparent';
            this.context.shadowBlur = 0;
            this.context.shadowOffsetX = 0;
            this.context.shadowOffsetY = 0;

            this.context.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            this.context.lineWidth = 1;
            this.context.strokeRect(x, y, w, h);
            this.context.fillStyle = 'rgba(255, 255, 255, 0.15)';
            this.context.fillRect(x + 2, y + 1, w / 3, 2);
        }
    }

    private drawFallback(entity: VisualEntity): void {
        // ... оригинальный код ...
        this.context.fillStyle = '#ff00ff';
        this.context.fillRect(entity.renderX - entity.width / 2, entity.renderY - entity.height / 2, entity.width, entity.height);
    }
}