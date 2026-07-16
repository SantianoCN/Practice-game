export class Account {
    public id: string;
    public login: string;
    public passwordHash: string;
    public refreshToken: string;

    constructor(id: string, login: string, passwordHash: string, refreshToken: string = '') {
        this.id = id;
        this.login = login;
        this.passwordHash = passwordHash;
        this.refreshToken = refreshToken;
    }
}