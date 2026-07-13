import { GameRender } from './screenRender';
import { GameSnapshot } from '../../../shared/gameTypes';

// 1. Инициализируем холст и ваш рендерер
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
if (!canvas) {
  throw new Error('Canvas с id "gameCanvas" не найден на странице');
}

const renderer = new GameRender(canvas);

// 2. Инициализируем стартовые координаты комнат матрицы 7x7
let currentX = 3; // Старт в центре матрицы
let currentY = 3;

// 3. Формируем mockSnapshot в строгом соответствии с интерфейсом GameSnapshot
const mockSnapshot: GameSnapshot = {
  players: [
    {
      id: 'player-1',
      x: 400,
      y: 300,
      hp: 100,
      maxHp: 100,
      mana: 50,
      maxMana: 50,
      width: 32,
      height: 32,
      sprite: 'hero_idle'
    }
  ],
  bullets: [
    { id: 'b-1', x: 250, y: 200, width: 8, height: 8 },
    { id: 'b-2', x: 500, y: 350, width: 8, height: 8 }
  ],
  room: {
    gridX: currentX,
    gridY: currentY,
    isClear: false,
    hasDoors: { Top: true, Bottom: true, Left: true, Right: true },
    respawnedEntity: [],
    enemies: [
      { id: 'e-1', x: 200, y: 450, hp: 50, maxHp: 50, width: 24, height: 24, sprite: 'skeleton' },
      { id: 'e-2', x: 650, y: 150, hp: 50, maxHp: 50, width: 24, height: 24, sprite: 'goblin' }
    ],
    distansToSpawn: 0,
    type: 'Start'
  }
};

// 4. Игровой цикл рендеринга
function gameLoop() {
  // Динамически обновляем координаты комнаты в snapshot перед отрисовкой
  mockSnapshot.room.gridX = currentX;
  mockSnapshot.room.gridY = currentY;

  // Вызываем ваш метод рендера
  renderer.render(mockSnapshot);

  // Запрашиваем отрисовку следующего кадра
  requestAnimationFrame(gameLoop);
}

// Запускаем цикл
gameLoop();

// 5. Интерактив: управление через стрелочки на клавиатуре
window.addEventListener('keydown', (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowUp':
      if (currentY > 0) currentY--;
      break;
    case 'ArrowDown':
      if (currentY < 6) currentY++; // 6 — максимальный индекс для матрицы 7х7
      break;
    case 'ArrowLeft':
      if (currentX > 0) currentX--;
      break;
    case 'ArrowRight':
      if (currentX < 6) currentX++;
      break;
  }
});
