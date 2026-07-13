
export class Account {
    public login: string;
    public passwordHash: string;
    public refreshToken: string;

    public constructor(login: string, password: string, token: string = '') {
        this.login = login;
        this.passwordHash = password; // hash(password)
        this.refreshToken = token;
    }
}
