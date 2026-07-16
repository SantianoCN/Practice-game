import { Player } from '../../domain/entities/Player';
import { Room } from '../../domain/world/Room';

export class GameSession {
    public players: Map<string, Player> = new Map();
    public floorMap: (Room | null)[][] = [];

    constructor(
        public readonly sessionId: string,
        public readonly roomWidth: number,
        public readonly roomHeight: number
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
        return this.players.size === 0;
    }
}