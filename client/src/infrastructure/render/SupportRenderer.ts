import Pica from 'pica';
import { VisualEntity } from '../../domain/entities/VisualEntity';

export interface EntityRenderer {
    draw(context: CanvasRenderingContext2D, entity: VisualEntity): void;
}

const pica = Pica();

export class TextureRenderer implements EntityRenderer {
    private texture: HTMLImageElement | HTMLCanvasElement;
    private isLoaded: boolean = false;
    
    private readonly originalFrameWidth: number = 280;
    private readonly originalFrameHeight: number = 300;

    private frameWidth: number = 40;
    private frameHeight: number = 40;

    constructor(imagePath: string) {
        const img = new Image();
        img.src = imagePath;
        this.texture = img;

        this.frameWidth = this.originalFrameWidth;
        this.frameHeight = this.originalFrameHeight;
        
        img.onload = () => {
            const origW = img.width;
            const origH = img.height;

            const targetFrameHeight = 40; 
            const scale = targetFrameHeight / this.originalFrameHeight;
            
            const targetW = Math.round(origW * scale);
            const targetH = Math.round(origH * scale);

            const outCanvas = document.createElement('canvas');
            outCanvas.width = targetW;
            outCanvas.height = targetH;

            pica.resize(img, outCanvas, { filter: 'lanczos3' })
                .then(() => {
                    this.frameWidth = Math.round(this.originalFrameWidth * scale);
                    this.frameHeight = targetFrameHeight;
                    this.texture = outCanvas;
                    this.isLoaded = true;
                })
                .catch(() => {
                    this.frameWidth = this.originalFrameWidth;
                    this.frameHeight = this.originalFrameHeight;
                    this.texture = img;
                    this.isLoaded = true;
                });
        };
    }

    public draw(context: CanvasRenderingContext2D, entity: VisualEntity): void {
        const facing = entity.lastFacing === 'left' ? 'left' : 'right'; 
        const animation = entity.currentAnimation || 'idle';

        const rx = Math.round(entity.renderX);
        const ry = Math.round(entity.renderY);
        const rw = Math.round(entity.width);
        const rh = Math.round(entity.height);

        context.save();

        let startY = 0;
        
        if (animation === 'move') {
            startY = this.frameHeight;
        } else if (animation === 'attack') {
            startY = this.frameHeight * 2;
        }

        const currentFrame = (entity.currentFrame || 0) % 3;
        const startX = currentFrame * this.frameWidth;
        if (facing === 'left') {
            context.translate(rx, ry);
            context.scale(-1, 1);
            context.drawImage(
                this.texture, 
                startX, startY, this.frameWidth, this.frameHeight,
                -Math.round(rw / 2), -Math.round(rh / 2), rw, rh
            );
        } else {
            context.drawImage(
                this.texture, 
                startX, startY, this.frameWidth, this.frameHeight,
                rx - Math.round(rw / 2), ry - Math.round(rh / 2), rw, rh
            );
        }
        
        context.restore();

        if (entity.hp !== undefined && entity.maxHp !== undefined && entity.type !== 'player') {
            this.drawHpBar(context, entity);
        }
    }

    private drawHpBar(context: CanvasRenderingContext2D, entity: VisualEntity): void {
        const barWidth = Math.round(entity.width);
        const barHeight = 5;
        const barX = Math.round(entity.renderX - barWidth / 2);
        const barY = Math.round(entity.renderY - entity.height / 2 - 10);

        context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        context.fillRect(barX, barY, barWidth, barHeight);

        const hpPercentage = Math.max(0, entity.hp / entity.maxHp);
        context.fillStyle = '#2ecc71'; 
        context.fillRect(barX, barY, Math.round(barWidth * hpPercentage), barHeight);
    }
}

export class BoxRenderer implements EntityRenderer {
    constructor(private color: string) {}

    public draw(context: CanvasRenderingContext2D, entity: VisualEntity): void {
        const rx = Math.round(entity.renderX);
        const ry = Math.round(entity.renderY);
        const rw = Math.round(entity.width);
        const rh = Math.round(entity.height);
        context.fillStyle = this.color;
        context.fillRect(rx - Math.round(rw / 2), ry - Math.round(rh / 2), rw, rh);
    }
}