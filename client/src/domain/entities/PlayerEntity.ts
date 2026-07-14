import { InterpolatedEntity } from "./InterpolatedEntity";

export class PlayerEntity extends InterpolatedEntity {
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