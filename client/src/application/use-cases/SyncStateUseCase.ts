import { 
    GameSnapshotDTO, 
    RoomState, 
    PlayerState, 
    EnemyState, 
    BulletState 
} from '@game/shared';
import { VisualEntity } from '../../domain/entities/VisualEntity';

export class SyncStateUseCase {
    public entities = new Map<string, VisualEntity>();
    public currentRoomState: RoomState | null = null;

    public processSnapshot(snapshot: GameSnapshotDTO): void {
        const activeIds = new Set<string>();
        this.currentRoomState = snapshot.room;

        snapshot.players.forEach(p => {
            activeIds.add(p.id);
            this.updateOrCreate(p.id, p, p.hp, p.maxHp, p.mana, p.maxMana, p.gold, p.activeWeaponVisualId, 'player', 0);
        });

        snapshot.enemies.forEach(e => {
            activeIds.add(e.id);
            this.updateOrCreate(e.id, e, e.hp, e.maxHp, 0, 0, 0, '', 'enemy', 0);
        });

        snapshot.bullets.forEach(b => {
            activeIds.add(b.id);
            this.updateOrCreate(b.id, b, 0, 0, 0, 0, 0, '', 'bullet', b.speed);
        });

        for (const [id, entity] of this.entities.entries()) {
            if (!activeIds.has(id)) entity.isDying = true;
        }
    }

    private updateOrCreate(
        id: string, 
        data: PlayerState | EnemyState | BulletState, 
        hp: number, 
        maxHp: number, 
        mana: number, 
        maxMana: number, 
        gold: number, 
        activeWeaponVisualId: string, 
        type: 'player' | 'enemy' | 'bullet',
        speed: number
    ): void {
        let entity = this.entities.get(id);
        if (!entity) {
            entity = new VisualEntity(id, data.x, data.y, data.width, data.height, data.visualId, type, speed);
            this.entities.set(id, entity);
        } else {
            if (data.x < entity.targetX) {
                entity.lastFacing = 'left';
            } else if (data.x > entity.targetX) {
                entity.lastFacing = 'right';
            } else if (data.x === entity.targetX && data.y === entity.targetY) {
                entity.lastFacing = 'Top';
            }

            if (data.x !== entity.targetX || data.y !== entity.targetY) {
                entity.currentAnimation = 'move';
            } else {
                entity.currentAnimation = 'idle';
            }

            entity.targetX = data.x;
            entity.targetY = data.y;
            entity.visualId = data.visualId;
            entity.speed = speed;
        }
        entity.hp = hp; 
        entity.maxHp = maxHp;
        entity.mana = mana; 
        entity.maxMana = maxMana;
        entity.gold = gold; 
        entity.activeWeaponVisualId = activeWeaponVisualId;
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