import { GameSnapshotDTO } from '@game/shared';
import { VisualEntity } from '../../domain/entities/VisualEntity';

export class SyncStateUseCase {
    public entities = new Map<string, VisualEntity>();
    public currentRoomState: any = null;

    public processSnapshot(snapshot: GameSnapshotDTO): void {
        const activeIds = new Set<string>();
        this.currentRoomState = snapshot.room;

        snapshot.players.forEach(p => {
            activeIds.add(p.id);
            this.updateOrCreate(p.id, p, p.hp, p.maxHp, p.mana, p.maxMana, 'player');
        });

        snapshot.enemies.forEach(e => {
            activeIds.add(e.id);
            this.updateOrCreate(e.id, e, e.hp, e.maxHp, 0, 0, 'enemy');
        });

        snapshot.bullets.forEach(b => {
            activeIds.add(b.id);
            this.updateOrCreate(b.id, b, 0, 0, 0, 0, 'bullet');
        });

        for (const [id, entity] of this.entities.entries()) {
            if (!activeIds.has(id)) entity.isDying = true;
        }
    }

    private updateOrCreate(id: string, data: any, hp: number, maxHp: number, mana: number, maxMana: number, type: 'player'|'enemy'|'bullet') {
        let entity = this.entities.get(id);
        if (!entity) {
            entity = new VisualEntity(id, data.x, data.y, data.width, data.height, data.sprite, type);
            this.entities.set(id, entity);
        } else {
            if (data.x < entity.targetX) entity.lastFacing = 'left';
            else if (data.x > entity.targetX) entity.lastFacing = 'right';

            entity.targetX = data.x;
            entity.targetY = data.y;
            entity.sprite = data.sprite;
        }
        entity.hp = hp; entity.maxHp = maxHp;
        entity.mana = mana; entity.maxMana = maxMana;
    }

    public tickInterpolation(dt: number): void {
        this.entities.forEach((entity, id) => {
            entity.updateInterpolation(dt);
            
            if (entity.isDying) {
                if (entity.type === 'bullet') {
                    if (entity.hasReachedTarget()) {
                        this.entities.delete(id);
                    }
                } else {
                    this.entities.delete(id);
                }
            }
        });
    }

    public clear(): void {
        this.entities.clear();
        this.currentRoomState = null;
    }
}