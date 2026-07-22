import { IGameRepository } from '../interfaces/IGameRepository';
import { IPresetProvider } from '../interfaces/IPresetProvider';
import { IIdGenerator } from '../interfaces/IIdGenerator';
import { MapGenerator } from '../../domain/world/FloorGenerator';
import { GAME_CONFIG, GAME_DIFFICULTY, FloorDifficulty } from '@game/shared';

export class NextFloorUseCase {
    constructor(
        private gameRepo: IGameRepository,
        private presetProvider: IPresetProvider,
        private idGen: IIdGenerator
    ) {}

    public execute(sessionId: string): boolean {
        const session = this.gameRepo.get(sessionId);
        if (!session) return false;

        const currentDifficulty = session.difficulty;
        const nextLevelNumber = (currentDifficulty.levelNumber || 1) + 1;
        
        let nextDifficulty: FloorDifficulty;
        const difficultyKey = `LVL${nextLevelNumber}`;
        
        if (GAME_DIFFICULTY[difficultyKey]) {
            nextDifficulty = GAME_DIFFICULTY[difficultyKey];
        } else {
            nextDifficulty = {
                levelNumber: nextLevelNumber,
                ROOM_COUNT: 15 + (nextLevelNumber - 2) * 3
            };
        }

        session.difficulty = nextDifficulty;

        const mapGenerator = new MapGenerator(
            GAME_CONFIG.MAP_SIZE,
            session.difficulty,
            session.roomWidth,
            session.roomHeight,
            (prefix) => this.idGen.generateId(prefix),
            (id) => this.presetProvider.getChestPreset(id)
        );

        session.floorMap = mapGenerator.generate();

        const startX = Math.floor(GAME_CONFIG.MAP_SIZE / 2);
        const startY = Math.floor(GAME_CONFIG.MAP_SIZE / 2);

        for (const player of session.players.values()) {
            if (player.isDead()) continue;

            player.roomX = startX;
            player.roomY = startY;
            player.x = session.roomWidth / 2;
            player.y = session.roomHeight / 2;
            player.vx = 0;
            player.vy = 0;
            player.lastBroadcastedRoomX = null;
            player.lastBroadcastedRoomY = null;
        }

        console.log(`[Floor Transition] Сессия ${sessionId} успешно перешла на этаж ${nextLevelNumber} (Сложность: ${nextDifficulty.ROOM_COUNT} комнат)`);
        return true;
    }
}