import { 
    GameSnapshotDTO, 
    RoomState, 
    PlayerState, 
    EnemyState, 
    BulletState,
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
        const activeIds = new Set<string>();
        this.currentRoomState = snapshot.room;

        snapshot.players.forEach(serverPlayer => {
            activeIds.add(serverPlayer.id);

            let visualPlayer = this.entities.get(serverPlayer.id);

            if (!visualPlayer) {
                visualPlayer = new VisualEntity(
                    serverPlayer.id,
                    serverPlayer.x,
                    serverPlayer.y,
                    serverPlayer.width,
                    serverPlayer.height,
                    serverPlayer.maxInventoryLength,
                    serverPlayer.visualId,
                    'player'
                );
                this.entities.set(serverPlayer.id, visualPlayer);
            } else {
                if (serverPlayer.x < visualPlayer.targetX) {
                    visualPlayer.lastFacing = 'left';
                } else if (serverPlayer.x > visualPlayer.targetX) {
                    visualPlayer.lastFacing = 'right';
                }

                if (serverPlayer.x !== visualPlayer.targetX || serverPlayer.y !== visualPlayer.targetY) {
                    visualPlayer.currentAnimation = 'move';
                } else {
                    visualPlayer.currentAnimation = 'idle';
                }
            }

            visualPlayer.targetX = serverPlayer.x;
            visualPlayer.targetY = serverPlayer.y;
            visualPlayer.hp = serverPlayer.hp;
            visualPlayer.maxHp = serverPlayer.maxHp;
            visualPlayer.mana = serverPlayer.mana;
            visualPlayer.maxMana = serverPlayer.maxMana;
            visualPlayer.gold = serverPlayer.gold;
            visualPlayer.inventory = serverPlayer.inventory || [];
            visualPlayer.currentWeaponIndex = serverPlayer.currentWeaponIndex ?? 0;
            visualPlayer.maxInventoryLength = serverPlayer.maxInventoryLength ?? (serverPlayer as any).maxInventoryLength ?? 3;
            visualPlayer.activeWeaponVisualId = serverPlayer.activeWeaponVisualId || 'iron_sword';
        });

        snapshot.enemies.forEach(e => {
            activeIds.add(e.id);
            this.updateOrCreate(e.id, e, e.hp, e.maxHp, 0, 0, 0, '', 'enemy', 0);
        });

        snapshot.bullets.forEach(b => {
            activeIds.add(b.id);
            this.updateOrCreate(b.id, b, 0, 0, 0, 0, 0, '', 'bullet', b.speed);
            const entity = this.entities.get(b.id)!;
            entity.angle = b.angle;
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
            entity = new VisualEntity(id, data.x, data.y, data.width, data.height, 1, data.visualId, type, speed);
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
        this.staticObstacles = [];
    }
}