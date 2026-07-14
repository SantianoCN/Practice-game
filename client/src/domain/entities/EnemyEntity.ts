import { InterpolatedEntity } from "./InterpolatedEntity";

export class EnemyEntity extends InterpolatedEntity {
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