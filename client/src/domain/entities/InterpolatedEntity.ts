export abstract class InterpolatedEntity {
  public id: string;
  public targetX: number;
  public targetY: number;
  public renderX: number;
  public renderY: number;
  public width: number;
  public height: number;
  public isDying: boolean = false;
  public lastFacing: 'left' | 'right' = 'right';

  constructor(id: string, startX: number, startY: number, width: number, height: number) {
    this.id = id;
    this.targetX = startX;
    this.targetY = startY;
    this.renderX = startX;
    this.renderY = startY;
    this.width = width;
    this.height = height;
  }

  public updateInterpolation(dt: number, lerpSpeed: number = 12): void {
    const t = 1 - Math.exp(-lerpSpeed * dt);
    
    this.renderX += (this.targetX - this.renderX) * t;
    this.renderY += (this.targetY - this.renderY) * t;
  }

  public hasReachedTarget(epsilon: number = 2): boolean {
    const dx = Math.abs(this.targetX - this.renderX);
    const dy = Math.abs(this.targetY - this.renderY);
    return dx < epsilon && dy < epsilon;
  }
}