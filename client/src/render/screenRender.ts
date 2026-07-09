import { GameSnapshot } from '../../../shared/gameTypes';

export class GameRender {
  private context: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement; 

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Cannot get 2D context')
    }
    this.context = ctx
  }

  public render(snapshot: GameSnapshot): void {
    this.clear();
    this.drawScreen(snapshot)
  }

  private clear(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private drawScreen(snapshot: GameSnapshot): void {
    this.drawMap();
    this.drawPlayer();
    this.drawBullet();
    this.drawParticle()
  }

  private drawMap(): void {
    
  }

  private drawPlayer(): void {

  }

  private drawBullet(): void {
    
  }

  private drawParticle(): void {
    
  }

}