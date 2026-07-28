import { Player } from './Player';
import { Room } from './Room';
import { FloorDifficulty } from '@game/shared';

export class GameSession {
    public players: Map<string, Player> = new Map();
    public floorMap: (Room | null)[][] = [];
    public isSingleplayer: boolean = false;
    public isRestoredSave: boolean = false;
    public isLobby: boolean = false;
    public hostAccountId: string = '';
    public allowedAccountIds: Set<string> = new Set();
    public isGameOver: boolean = false;

    constructor(
        public sessionId: string,
        public readonly roomWidth: number,
        public readonly roomHeight: number,
        public difficulty: FloorDifficulty
    ) {}

    public getPlayer(accountId: string): Player | undefined {
        return this.players.get(accountId);
    }

    public addPlayer(player: Player): void {
        this.players.set(player.id, player);
    }

    public removePlayer(accountId: string): void {
        this.players.delete(accountId);
    }

    public getRoom(x: number, y: number): Room | null {
        if (y < 0 || y >= this.floorMap.length) return null;
        if (x < 0 || x >= this.floorMap[y].length) return null;
        return this.floorMap[y][x];
    }

    public isEmpty(): boolean {
        return Array.from(this.players.values()).filter(p => p.isOnline).length === 0;
    }
}