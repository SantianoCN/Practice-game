import { VisualEntity } from '../../domain/entities/VisualEntity';

export interface EntityRenderer {
    draw(context: CanvasRenderingContext2D, entity: VisualEntity): void;
}

export class TextureRenderer implements EntityRenderer {
    private texture: HTMLImageElement;
    private isLoaded: boolean = false;

    constructor(imagePath: string) {
        this.texture = new Image();
        this.texture.onload = () => { this.isLoaded = true; };
        this.texture.src = imagePath;
    }

    public draw(context: CanvasRenderingContext2D, entity: VisualEntity): void {
        const facing = entity.lastFacing || 'right';

        if (this.isLoaded && this.texture.naturalWidth !== 0) {
            context.save();
            if (facing === 'left') {
                context.translate(entity.renderX, entity.renderY);
                context.scale(-1, 1);
                context.drawImage(this.texture, -entity.width / 2, -entity.height / 2, entity.width, entity.height);
            } else {
                context.drawImage(this.texture, entity.renderX - entity.width / 2, entity.renderY - entity.height / 2, entity.width, entity.height);
            }
            context.restore();
        } else {
            context.fillStyle = '#ff00ff';
            context.fillRect(entity.renderX - entity.width / 2, entity.renderY - entity.height / 2, entity.width, entity.height);
        }

        if (entity.hp !== undefined && entity.maxHp !== undefined) {
            this.drawHpBar(context, entity);
        }
    }

    private drawHpBar(context: CanvasRenderingContext2D, entity: VisualEntity): void {
        const barWidth = entity.width;
        const barHeight = 5;
        const barX = entity.renderX - barWidth / 2;
        const barY = entity.renderY - entity.height / 2 - 10;

        context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        context.fillRect(barX, barY, barWidth, barHeight);

        const hpPercentage = Math.max(0, entity.hp / entity.maxHp);
        context.fillStyle = '#2ecc71'; 
        context.fillRect(barX, barY, barWidth * hpPercentage, barHeight);
    }
}

export class BoxRenderer implements EntityRenderer {
    constructor(private color: string) {}

    public draw(context: CanvasRenderingContext2D, entity: VisualEntity): void {
        context.fillStyle = this.color;
        context.fillRect(entity.renderX - entity.width / 2, entity.renderY - entity.height / 2, entity.width, entity.height);
    }
}