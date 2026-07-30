import { SOUNDS } from './../../../assets/index'


export class SoundRender {
  private sounds: Map<string, HTMLAudioElement> = new Map();

  public envVolume: number = 0.5;
  public attackVolume: number = 0.8;
  public interactionVolume: number = 0.3;

  public initSound(): void {
    this.loadSound('envMusic', SOUNDS.env.envMusic);
    this.loadSound('house', SOUNDS.env.houseMusic);

    this.loadSound('commonSlash', SOUNDS.attack.commonSlash);
    this.loadSound('bowShoot', SOUNDS.attack.bowAttack);
    this.loadSound('fireCast', SOUNDS.attack.fireCast);
    this.loadSound('iceCast', SOUNDS.attack.iceCast);
    this.loadSound('lightningCast', SOUNDS.attack.lightningCast)

    this.loadSound('playerTakeDamage', SOUNDS.interaction.playerDamage)
  }

  private loadSound(key: string, src: string): void {
    const audio = new Audio(src);
    audio.preload = 'auto';
    this.sounds.set(key, audio)
  }

  public playSound(key: string, type: 'envMusic' | 'interaction' | 'attack'): void {
    const sound = this.sounds.get(key);
    if (!sound) return;

    if (type === 'envMusic') {
      sound.loop = true;
      sound.volume = this.envVolume;

      const attemptPlay = () => {
        if (sound.paused) {
          sound.play().catch((err) => {
            console.warn(`[Audio] Ждем клика пользователя для воспроизведения ${key}:`, err);
            
            const playOnInteraction = () => {
              sound.play().catch(() => {});
              window.removeEventListener('click', playOnInteraction);
              window.removeEventListener('keydown', playOnInteraction);
            };
            window.addEventListener('click', playOnInteraction);
            window.addEventListener('keydown', playOnInteraction);
          });
        }
      };

      if (sound.readyState < 3) {
        sound.addEventListener('canplaythrough', () => attemptPlay(), { once: true });
      } else {
        attemptPlay();
      }
      return;
    }

    const sfxClone = sound.cloneNode() as HTMLAudioElement;
    if (type === 'interaction') sound.volume = this.interactionVolume;
    if (type === 'attack') sound.volume = this.attackVolume;

    sound.onended = () => {
        sound.remove();
      };

    sound.play().catch((err) => {
      console.warn(`Не удалось воспроизвести звук ${key}:`, err);
    });
  }

  public stopSound(key: string): void {
    const sound = this.sounds.get(key);
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
    }
  }
}

export const audio = new SoundRender();