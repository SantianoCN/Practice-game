import { 
    GameSnapshotDTO, 
    RoomState, 
    RoomInitDTO, 
    ObstacleState 
} from '@game/shared';
import { VisualEntity } from '../../domain/entities/VisualEntity';

export class SyncStateUseCase {
    public entities = new Map<string, VisualEntity>();
    public currentRoomState: RoomState | null = null;
    public staticObstacles: ObstacleState[] = [];

    public setStaticRoom(roomInit: RoomInitDTO): void {
        this.staticObstacles = roomInit.obstacles;
    }

    public processSnapshot(snapshot: GameSnapshotDTO): void {
        this.currentRoomState = snapshot.room;
        const activeIdsInSnapshot = new Set<string>();

        for (const p of snapshot.players) {
            activeIdsInSnapshot.add(p.id);
            const entity = this.getOrCreateEntity(
                p.id, p.x, p.y, p.width, p.height, 
                p.maxInventoryLength ?? 3, p.visualId, 'player'
            );

            this.updateFacingAndAnimation(entity, p.x, p.y, p.hp);

            entity.targetX = p.x;
            entity.targetY = p.y;
            entity.hp = p.hp;
            entity.maxHp = p.maxHp;
            entity.mana = p.mana;
            entity.maxMana = p.maxMana;
            entity.gold = p.gold;
            entity.inventory = p.inventory || [];
            entity.currentWeaponIndex = p.currentWeaponIndex ?? 0;
            entity.activeWeaponVisualId = p.activeWeaponVisualId || 'iron_sword';
        }

        for (const e of snapshot.enemies) {
            activeIdsInSnapshot.add(e.id);
            const entity = this.getOrCreateEntity(
                e.id, e.x, e.y, e.width, e.height, 
                1, e.visualId, 'enemy'
            );

            this.updateFacingAndAnimation(entity, e.x, e.y, e.hp);

            entity.targetX = e.x;
            entity.targetY = e.y;
            entity.hp = e.hp;
            entity.maxHp = e.maxHp;
        }

        for (const b of snapshot.bullets) {
            activeIdsInSnapshot.add(b.id);
            const entity = this.getOrCreateEntity(
                b.id, b.x, b.y, b.width, b.height, 
                1, b.visualId, 'bullet'
            );

            entity.targetX = b.x;
            entity.targetY = b.y;
            entity.angle = b.angle;
        }

        for (const id of this.entities.keys()) {
            if (!activeIdsInSnapshot.has(id)) {
                this.entities.delete(id);
            }
        }
    }

    public tickInterpolation(dt: number): void {
        this.entities.forEach(entity => {
            entity.updateInterpolation(dt);
        });
    }

    private getOrCreateEntity(
        id: string, 
        x: number, 
        y: number, 
        w: number, 
        h: number, 
        maxInv: number, 
        visualId: string, 
        type: 'player' | 'enemy' | 'bullet'
    ): VisualEntity {
        let entity = this.entities.get(id);
        if (!entity) {
            entity = new VisualEntity(id, x, y, w, h, maxInv, visualId, type);
            this.entities.set(id, entity);
        }
        return entity;
    }

    private updateFacingAndAnimation(entity: VisualEntity, newX: number, newY: number, hp: number): void {
        if (newX < entity.targetX) {
            entity.lastFacing = 'left';
        } else if (newX > entity.targetX) {
            entity.lastFacing = 'right';
        }

        if (hp <= 0) {
            entity.currentAnimation = 'die';
        } else if (newX !== entity.targetX || newY !== entity.targetY) {
            entity.currentAnimation = 'move';
        } else {
            entity.currentAnimation = 'idle';
        }
    }

    public clear(): void {
        this.entities.clear();
        this.currentRoomState = null;
        this.staticObstacles = [];
    }
}