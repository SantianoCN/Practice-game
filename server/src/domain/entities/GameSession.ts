import { Player } from './Player';
import { Room } from './Room';
import { FloorDifficulty } from '@game/shared';

export class GameSession {
    public players: Map<string, Player> = new Map();
    public floorMap: (Room | null)[][] = [];
    
    public isLobby: boolean = false;
    public hostId: string = '';
    public hostLogin: string = '';
    public allowedLogins: Set<string> = new Set();

    constructor(
        public readonly sessionId: string,
        public readonly roomWidth: number,
        public readonly roomHeight: number,
        public difficulty: FloorDifficulty
    ) {}

    public getPlayer(userId: string): Player | undefined {
        return this.players.get(userId);
    }

    public addPlayer(player: Player): void {
        this.players.set(player.id, player);
    }

    public removePlayer(userId: string): void {
        this.players.delete(userId);
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