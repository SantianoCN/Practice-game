import { 
    PlayerActionDTO, GameSnapshotDTO, SessionCreateRequestDTO, 
    SessionCreateResponseDTO, SessionJoinRequestDTO, SessionJoinResponseDTO, 
    PlayerClassPresetDTO, RoomInitDTO, BuyItemResponseDTO, PlayerProgressDTO
} from '@game/shared';

export interface INetworkClient {
    connect(token: string): Promise<{ login: string, progress?: PlayerProgressDTO, activeSaveSessionId?: string | null }>;
    disconnect(): void;
    requestProfile(): Promise<{ login: string, progress?: PlayerProgressDTO, activeSaveSessionId?: string | null }>;
    
    createSession(req: SessionCreateRequestDTO): Promise<SessionCreateResponseDTO>;
    createLobby(req: SessionCreateRequestDTO): Promise<SessionCreateResponseDTO>;
    joinLobby(req: SessionJoinRequestDTO): Promise<SessionJoinResponseDTO>;
    sendStartMatch(): void;
    
    restoreSave(): Promise<{ success: boolean; sessionId?: string; message?: string }>;
    
    buyItem(itemPresetId: string): Promise<BuyItemResponseDTO>;
    completeSession(): Promise<BuyItemResponseDTO>;
    
    leaveSession(): void;
    sendPlayerAction(action: PlayerActionDTO): void;
    
    onSnapshot(callback: (snapshot: GameSnapshotDTO) => void): void;
    onPlayerId(callback: (id: string) => void): void;
    onClassPresets(callback: (presets: Record<string, PlayerClassPresetDTO>) => void): void;
    onError(callback: (msg: string) => void): void;
    onRoomInit(cb: (data: RoomInitDTO) => void): void;
    
    onSyncProgress(cb: (progress: PlayerProgressDTO) => void): void;
    onSessionCompleted(cb: (data: { message: string, progress: PlayerProgressDTO }) => void): void;
    onSessionTerminated(cb: (data: { message: string }) => void): void;
    saveAndExit(): Promise<{ success: boolean; message?: string }>;
    sendNextFloor(): void;
    onPortalInteract(cb: () => void): void;
}