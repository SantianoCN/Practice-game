import Bullet from "./Bullet";
import Enemy from "./Enemy";
import Player from "./Player";


export interface GameSession {
    players: Player[];
    enemies: Enemy[];
    bullets: Bullet[];
}