import { PlayerProgress } from './PlayerProgress';

export class Account {
    public id: string;
    public login: string;
    public passwordHash: string;
    public refreshToken: string;
    public progress?: PlayerProgress;

    constructor(
        id: string, 
        login: string, 
        passwordHash: string, 
        refreshToken: string = '', 
        progress?: PlayerProgress
    ) {
        this.id = id;
        this.login = login;
        this.passwordHash = passwordHash;
        this.refreshToken = refreshToken;
        this.progress = progress;
    }
}