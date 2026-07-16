import { Account } from '../../domain/entities/Account';

export interface IAccountRepository {
    /** Возвращает аккаунт по логину (для проверки пароля при входе) */
    getByLogin(login: string): Promise<Account | null>;

    /** Возвращает аккаунт по сессионному токену (для middleware) */
    getByToken(token: string): Promise<Account | null>;

    /** Создает новую запись в БД при регистрации */
    create(login: string, passwordHash: string, token: string): Promise<Account>;

    /** Обновляет рефреш-токен (при логине или логауте) */
    updateToken(id: string, token: string): Promise<Account>;
}