"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Account = void 0;
class Account {
    id;
    login;
    passwordHash;
    refreshToken;
    constructor(id, login, passwordHash, refreshToken = '') {
        this.id = id;
        this.login = login;
        this.passwordHash = passwordHash;
        this.refreshToken = refreshToken;
    }
}
exports.Account = Account;
