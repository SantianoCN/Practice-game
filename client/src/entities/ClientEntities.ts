export abstract class MovingEntity {
  public id: string;
  public targetX: number;
  public targetY: number;
  public renderX: number;
  public renderY: number;
  public width: number;
  public height: number;
  public isDying: boolean = false;

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

export class ClientPlayer extends MovingEntity {
  public hp: number;
  public maxHp: number;
  public mana: number;
  public maxMana: number;
  public sprite: string;

  constructor(
    id: string, 
    startX: number, 
    startY: number, 
    width: number, 
    height: number, 
    hp: number, 
    maxHp: number, 
    mana: number, 
    maxMana: number, 
    sprite: string
  ) {
    super(id, startX, startY, width, height);
    this.hp = hp;
    this.maxHp = maxHp;
    this.mana = mana;
    this.maxMana = maxMana;
    this.sprite = sprite;
  }
}

export class ClientEnemy extends MovingEntity {
  public hp: number;
  public maxHp: number;
  public sprite: string;

  constructor(
    id: string, 
    startX: number, 
    startY: number, 
    width: number, 
    height: number, 
    hp: number, 
    maxHp: number, 
    sprite: string
  ) {
    super(id, startX, startY, width, height);
    this.hp = hp;
    this.maxHp = maxHp;
    this.sprite = sprite;
  }
}

export class ClientBullet extends MovingEntity {
    public speed: number = 300;

  constructor(
    id: string, 
    startX: number, 
    startY: number, 
    width: number, 
    height: number, 
  ) {
    super(id, startX, startY, width, height);
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