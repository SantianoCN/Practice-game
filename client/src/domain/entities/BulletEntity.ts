import { InterpolatedEntity } from "./InterpolatedEntity";

export class BulletEntity extends InterpolatedEntity {
    public speed: number = 300;
    public sprite: string;

  constructor(
    id: string, 
    startX: number, 
    startY: number, 
    width: number, 
    height: number, 
    sprite: string = 'default'
  ) {
    super(id, startX, startY, width, height);
    this.sprite = sprite
  }

  public override updateInterpolation(dt: number, lerpSpeed: number = 12): void {
    if (!this.isDying) {
      super.updateInterpolation(dt, lerpSpeed);
    } else {
      const dx = this.targetX - this.renderX;
      const dy = this.targetY - this.renderY;
      
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        const dirX = dx / distance;
        const dirY = dy / distance;

        const step = this.speed * dt;

        if (step >= distance) {
          this.renderX = this.targetX;
          this.renderY = this.targetY;
        } else {
          this.renderX += dirX * step;
          this.renderY += dirY * step;
        }
      }
    }
  }
}