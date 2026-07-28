import { VisualEntity } from '../../domain/entities/VisualEntity';

export interface EntityRenderer {
    draw(context: CanvasRenderingContext2D, entity: VisualEntity): void;
}

export class TextureRenderer implements EntityRenderer {
    private texture: HTMLImageElement;
    private isLoaded: boolean = false;
    private frameWidth: number = 280;
    private frameHeight: number = 300;

    constructor(imagePath: string) {
        this.texture = new Image();
        this.texture.onload = () => { this.isLoaded = true; };
        this.texture.src = imagePath;
    }

    public draw(context: CanvasRenderingContext2D, entity: VisualEntity): void {
        const facing = entity.lastFacing; 
        const animation = entity.currentAnimation || 'idle';

        const rx = Math.round(entity.renderX);
        const ry = Math.round(entity.renderY);
        const rw = Math.round(entity.width);
        const rh = Math.round(entity.height);

        if (this.isLoaded && this.frameWidth > 0) {
            context.save();

            let startY = 0;
            const isDead = entity.hp <= 0;

            if (isDead) {
                context.globalAlpha = 0.6;
                startY = 0;
            } else if (animation === 'attack') {
                startY = this.frameHeight * 2;
            } else if (animation === 'move') {
                startY = this.frameHeight;
            } 

            const currentFrame = isDead ? 0 : ((entity.currentFrame || 0) % 3);
            const startX = currentFrame * this.frameWidth;

            context.translate(rx, ry);

            if (isDead) {
                context.rotate(Math.PI / 2);
            } else if (facing === 'left') {
                context.scale(-1, 1);
            }

            context.drawImage(
                this.texture, 
                startX, startY, this.frameWidth, this.frameHeight,
                -Math.round(rw / 2), -Math.round(rh / 2), rw, rh
            );
            
            context.restore();
        } else {
            context.fillStyle = entity.hp <= 0 ? '#555555' : '#ff00ff';
            context.fillRect(rx - Math.round(rw / 2), ry - Math.round(rh / 2), rw, rh);
        }

        if (entity.hp !== undefined && entity.maxHp !== undefined && entity.type !== 'player' && entity.hp > 0) {
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