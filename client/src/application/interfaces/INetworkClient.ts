import { 
    PlayerActionDTO, GameSnapshotDTO, SessionCreateRequestDTO, 
    SessionCreateResponseDTO, SessionJoinRequestDTO, SessionJoinResponseDTO, PlayerClassPresetDTO
} from '@game/shared';

export interface INetworkClient {
    connect(token: string): Promise<void>;
    disconnect(): void;
    requestProfile(): Promise<string>;
    
    createSession(req: SessionCreateRequestDTO): Promise<SessionCreateResponseDTO>;
    joinSession(req: SessionJoinRequestDTO): Promise<SessionJoinResponseDTO>;
    leaveSession(): void;
    
    sendPlayerAction(action: PlayerActionDTO): void;
    
    onSnapshot(callback: (snapshot: GameSnapshotDTO) => void): void;
    onPlayerId(callback: (id: string) => void): void;
    onClassPresets(callback: (presets: Record<string, PlayerClassPresetDTO>) => void): void;
    onError(callback: (msg: string) => void): void;
}