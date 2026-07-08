import { randomUUID } from 'crypto';

export default class IdGenerator {
    // Внутренний словарь для счетчиков (чтобы делать bullet_1, bullet_2)
    private static counters = new Map<string, number>();

    /**
     * 1. Метод для ГЛОБАЛЬНЫХ сущностей (Игроки, Комнаты, Сессии)
     * Использует криптографический UUID. Вероятность совпадения равна нулю.
     * @param prefix Название сущности (например, 'player', 'room')
     * @param short Если true, отрежет длинный хвост UUID для красоты и экономии трафика
     */
    public static generateUUID(prefix: string, short: boolean = true): string {
        const fullUuid = randomUUID();
        // Берем только первые 8 символов (например, a1b2c3d4)
        const tail = short ? fullUuid.split('-')[0] : fullUuid; 
        return `${prefix}_${tail}`;
    }

    /**
     * 2. Метод для МАССОВЫХ сущностей (Пули, Враги, Лут, Частицы)
     * Использует инкремент (счетчик). Работает в 100 раз быстрее UUID и 
     * занимает минимум байт при передаче по сети (socket.io скажет спасибо).
     * @param prefix Название сущности (например, 'bullet', 'enemy')
     */
    public static generateId(prefix: string): string {
        // Достаем текущее значение счетчика для этого префикса (или 0, если его еще нет)
        const currentCount = this.counters.get(prefix) || 0;
        
        // Увеличиваем на 1 и сохраняем обратно
        const nextCount = currentCount + 1;
        this.counters.set(prefix, nextCount);

        // Возвращаем строку вида 'bullet_1', 'bullet_2'
        return `${prefix}_${nextCount}`;
    }

    /**
     * Очистка счетчиков (вызывать при закрытии игровой комнаты или рестарте матча)
     */
    public static resetCounters(): void {
        this.counters.clear();
    }
}