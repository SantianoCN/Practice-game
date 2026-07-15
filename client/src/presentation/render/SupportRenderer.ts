export interface EntityRenderer {
  draw(context: CanvasRenderingContext2D, entity: any): void;
}

export class TextureRenderer implements EntityRenderer {
  private texture: HTMLImageElement;
  private isLoaded: boolean = false;

  constructor(imagePath: string) {
    this.texture = new Image();
    
    this.texture.onload = () => {
      this.isLoaded = true;
    };

    this.texture.onerror = () => {
      console.error(`[TextureRenderer] Не удалось загрузить текстуру по пути: ${imagePath}`);
      this.isLoaded = false;
    };

    this.texture.src = imagePath; // Запускаем скачивание картинки браузером
  }

  public draw(context: CanvasRenderingContext2D, entity: any): void {
    const facing = entity.lastFacing || 'right';

    // Если локальная картинка загружена и готова к выводу
    if (this.isLoaded && this.texture.naturalWidth !== 0) {
      context.save(); // Сохраняем чистый холст перед трансформацией

      if (facing === 'left') {
        // Зеркальный разворот влево:
        // 1. Переносим центр координат в точку нахождения игрока
        context.translate(entity.renderX, entity.renderY);
        // 2. Инвертируем холст по горизонтальной оси X
        context.scale(-1, 1);
        
        // 3. Рисуем. Так как центр смещен, координаты считаются от 0 (центра игрока)
        context.drawImage(
          this.texture, 
          -entity.width / 2, 
          -entity.height / 2, 
          entity.width, 
          entity.height
        );
      } else {
        // Обычная отрисовка вправо (без изменения матрицы холста)
        context.drawImage(
          this.texture, 
          entity.renderX - entity.width / 2, 
          entity.renderY - entity.height / 2, 
          entity.width, 
          entity.height
        );
      }

      context.restore(); // Возвращаем холст в исходное состояние для других сущностей
    } else {
      // Резервный фолбек (фиолетовый квадрат), если картинка еще грузится или путь неверен
      context.fillStyle = '#ff00ff';
      context.fillRect(
        entity.renderX - entity.width / 2, 
        entity.renderY - entity.height / 2, 
        entity.width, 
        entity.height
      );
    }

    // Отрисовка полоски здоровья (HP Bar) над головой персонажа
    if (entity.hp !== undefined && entity.maxHp !== undefined) {
      this.drawHpBar(context, entity);
    }
  }

  private drawHpBar(context: CanvasRenderingContext2D, entity: any): void {
    const barWidth = entity.width;
    const barHeight = 5;
    const barX = entity.renderX - barWidth / 2;
    const barY = entity.renderY - entity.height / 2 - 10; // На 10 пикселей выше головы

    // Подложка
    context.fillStyle = 'rgba(0, 0, 0, 0.6)';
    context.fillRect(barX, barY, barWidth, barHeight);

    // Здоровье
    const hpPercentage = Math.max(0, entity.hp / entity.maxHp);
    context.fillStyle = '#2ecc71'; 
    context.fillRect(barX, barY, barWidth * hpPercentage, barHeight);
  }
}

export class BoxRenderer implements EntityRenderer {
  private color: string;

  constructor(color: string) {
    this.color = color;
  }

  public draw(context: CanvasRenderingContext2D, entity: any): void {
    context.fillStyle = this.color;
    context.fillRect(
      entity.renderX - entity.width / 2,
      entity.renderY - entity.height / 2,
      entity.width,
      entity.height
    );
  }
}