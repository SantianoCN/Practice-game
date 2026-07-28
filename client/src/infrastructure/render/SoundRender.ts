export class SoundRender {
  private sounds: Map<string, HTMLAudioElement> = new Map();

  public loadSound(key: string, src: string): void {
    const audio = new Audio(src);
    audio.preload = 'auto';
    this.sounds.set(key, audio)
  }

  public playSound(key: string): void {
    const sound = this.sounds.get(key);
    if (!sound) return

switch (key) {
      case 'envMusic':
        sound.loop = true;
        sound.volume = 1;
        
        if (sound.paused) {
          sound.play().catch((err) => {
            console.warn(`Не удалось воспроизвести ${key}:`, err);
          });
        }
        break;
    
      default:
        break;
    }
  }
  public stopSound(key: string): void {
    const sound = this.sounds.get(key);
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
    }
  }
}