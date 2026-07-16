import { GameSnapshotDTO } from '@game/shared';
import { VisualEntity } from '../../domain/entities/VisualEntity';

export interface IRenderer {
    render(
        snapshot: GameSnapshotDTO | null, 
        entities: Map<string, VisualEntity>, 
        myId: string
    ): void;
    reset(): void;
}