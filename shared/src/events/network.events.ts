export const ClientEvent = {
    CREATE_SESSION: 'client:create-session',
    CREATE_LOBBY: 'client:create-lobby',
    CONNECT_LOBBY: 'client:connect-lobby',
    START_GAME: 'client:start-game',
    LEAVE_SESSION: 'client:leave-session',
    PLAYER_ACTION: 'client:player-action',
    REQUEST_PROFILE: 'client:request-profile',
    COMPLETE_SESSION: 'client:complete-session',
    BUY_ITEM: 'client:buy-item' 
} as const;

export const ServerEvent = {
    SESSION_CREATE_RESPONSE: 'server:session-create-response',
    SESSION_JOIN_RESPONSE: 'server:session-join-response',
    SNAPSHOT: 'server:snapshot',
    ERROR: 'server:error',
    CLASS_PRESETS: 'server:class-presets',
    PLAYER_ID: 'server:player-id',
    SYNC_PROGRESS: 'server:sync-progress',
    SESSION_COMPLETED: 'server:session-completed', 
    SESSION_TERMINATED: 'server:session-terminated'
} as const;

export type ClientEventType = typeof ClientEvent[keyof typeof ClientEvent];
export type ServerEventType = typeof ServerEvent[keyof typeof ServerEvent];