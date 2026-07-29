import { VisualEntity } from '../../domain/entities/VisualEntity';
import { audio } from './SoundRender';


export interface EntityRenderer {
    draw(
        context: CanvasRenderingContext2D, 
        entity: VisualEntity, 
        weaponTexture?: HTMLImageElement | HTMLCanvasElement,
        weaponMeta?: { width: number; height: number }
    ): void;
}

export class TextureRenderer implements EntityRenderer {
    private walkTexture: HTMLImageElement;
    private idleTexture: HTMLImageElement;
    private isWalkLoaded: boolean = false;
    private isIdleLoaded: boolean = false;

    private readonly frameWidth: number = 300;
    private readonly frameHeight: number = 300;
    private readonly colsPerRow: number = 4;

    private readonly cropPaddingX: number = 60; 
    private readonly cropPaddingY: number = 40; 
    private readonly renderScale: number = 1;

    constructor(walkImagePath: string, idleImagePath?: string) {
        this.walkTexture = new Image();
        this.walkTexture.onload = () => { this.isWalkLoaded = true; };
        this.walkTexture.src = walkImagePath;

        this.idleTexture = new Image();
        if (idleImagePath) {
            this.idleTexture.onload = () => { this.isIdleLoaded = true; };
            this.idleTexture.src = idleImagePath;
        } else {
            this.idleTexture = this.walkTexture;
            this.isIdleLoaded = true;
        }
    }

    public draw(
        context: CanvasRenderingContext2D, 
        entity: VisualEntity, 
        weaponTexture?: HTMLImageElement | HTMLCanvasElement,
        weaponMeta?: { width: number; height: number }
    ): void {
        const facing = entity.lastFacing; 
        const animation = entity.currentAnimation || 'idle';

        const rx = Math.round(entity.renderX);
        const ry = Math.round(entity.renderY);
        const rw = Math.round((entity.width || 40) * this.renderScale);
        const rh = Math.round((entity.height || 40) * this.renderScale);

        const isDead = entity.hp <= 0;

        context.save();
        context.translate(rx, ry);

        if (isDead) {
            context.globalAlpha = 0.6;
            context.rotate(Math.PI / 2);
        } else if (facing === 'left') {
            context.scale(-1, 1);
        }

        const croppedWidth = this.frameWidth - (this.cropPaddingX * 2);
        const croppedHeight = this.frameHeight - (this.cropPaddingY * 2);

        if (isDead || animation === 'idle') {
            const img = this.isIdleLoaded ? this.idleTexture : this.walkTexture;
            const isLoaded = this.isIdleLoaded || this.isWalkLoaded;

            if (isLoaded) {
                if (img !== this.walkTexture) {
                    context.drawImage(
                        img, 
                        0, 0, img.width || this.frameWidth, img.height || this.frameHeight,
                        -Math.round(rw / 2), -Math.round(rh / 2), rw, rh
                    );
                } else {
                    context.drawImage(
                        img, 
                        this.cropPaddingX, this.cropPaddingY, croppedWidth, croppedHeight,
                        -Math.round(rw / 2), -Math.round(rh / 2), rw, rh
                    );
                }
            } else {
                this.drawFallbackBox(context, rw, rh, isDead);
            }
        } else if (animation === 'move') {
            if (this.isWalkLoaded) {
                const frameIndex = (entity.currentFrame || 0) % 8;
                const col = frameIndex % this.colsPerRow;
                const row = Math.floor(frameIndex / this.colsPerRow);

                const startX = (col * this.frameWidth) + this.cropPaddingX;
                const startY = (row * this.frameHeight) + this.cropPaddingY;

                context.drawImage(
                    this.walkTexture, 
                    startX, startY, croppedWidth, croppedHeight,
                    -Math.round(rw / 2), -Math.round(rh / 2), rw, rh
                );
            } else {
                this.drawFallbackBox(context, rw, rh, isDead);
            }
        }

        if (!isDead && weaponTexture) {
            this.drawWeaponOverlay(context, entity, weaponTexture, weaponMeta);
        }

        context.restore();

        if (entity.hp !== undefined && entity.maxHp !== undefined && entity.type !== 'player' && entity.hp > 0) {
            this.drawHpBar(context, entity);
        }
    }

    private drawWeaponOverlay(
        context: CanvasRenderingContext2D, 
        entity: VisualEntity, 
        weaponTexture: HTMLImageElement | HTMLCanvasElement,
        weaponMeta?: { width: number; height: number }
    ): void {
        context.save();

        const offsetX = 14; 
        const offsetY = -4;

        context.translate(offsetX, offsetY);

        const weaponW = weaponMeta?.width || weaponTexture.width || 24;
        const weaponH = weaponMeta?.height || weaponTexture.height || 24;

        if (entity.isAttackingAnim) {
            const progress = Math.min(1, entity.attackTimer / entity.attackDuration);
            const swingAngle = (-Math.PI / 4) + (progress * (Math.PI / 2));

            context.rotate(swingAngle);

            context.drawImage(
                weaponTexture,
                0, 0, weaponTexture.width, weaponTexture.height,
                -weaponW / 2, -weaponH / 2, weaponW, weaponH
            );
            switch (entity.activeWeaponVisualId) {
                case 'iron_sword':
                    audio.playSound('commonSkash', 'attack');
                    break;
                case 'battle_axe':
                    audio.playSound('commonSkash', 'attack');
                    break;
                case 'fire_staff':
                    audio.playSound('fireCast', 'attack');
                    break;
                case 'ice_staff':
                    audio.playSound('iceCast', 'attack');
                    break;
                case 'lightning_staff':
                    audio.playSound('lightningCast', 'attack');
                    break;
                case 'hunter_bow':
                    audio.playSound('bowShoot', 'attack');
                    break;
            }

        } else {
            context.drawImage(
                weaponTexture,
                0, 0, weaponTexture.width, weaponTexture.height,
                -weaponW / 2, -weaponH / 2, weaponW, weaponH
            );
        }

        context.restore();
    }

    private drawFallbackBox(context: CanvasRenderingContext2D, rw: number, rh: number, isDead: boolean): void {
        context.fillStyle = isDead ? '#555555' : '#ff00ff';
        context.fillRect(-Math.round(rw / 2), -Math.round(rh / 2), rw, rh);
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