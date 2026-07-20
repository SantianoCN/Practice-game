import { 
    PlayerActionDTO, GameSnapshotDTO, SessionCreateRequestDTO, 
    SessionCreateResponseDTO, SessionJoinRequestDTO, SessionJoinResponseDTO, 
    PlayerClassPresetDTO, RoomInitDTO
} from '@game/shared';

export interface INetworkClient {
    connect(token: string): Promise<void>;
    disconnect(): void;
    requestProfile(): Promise<string>;
    
    createSession(req: SessionCreateRequestDTO): Promise<SessionCreateResponseDTO>;
    createLobby(req: SessionCreateRequestDTO): Promise<SessionCreateResponseDTO>;
    joinLobby(req: SessionJoinRequestDTO): Promise<SessionJoinResponseDTO>;
    sendStartMatch(): void;
    
    leaveSession(): void;
    sendPlayerAction(action: PlayerActionDTO): void;
    
    onSnapshot(callback: (snapshot: GameSnapshotDTO) => void): void;
    onPlayerId(callback: (id: string) => void): void;
    onClassPresets(callback: (presets: Record<string, PlayerClassPresetDTO>) => void): void;
    onError(callback: (msg: string) => void): void;
    onRoomInit(cb: (data: RoomInitDTO) => void): void;
}