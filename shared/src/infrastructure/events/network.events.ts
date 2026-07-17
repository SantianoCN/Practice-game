export const ClientEvent = {
    CREATE_SESSION: 'client:create-session',
    CONNECT_SESSION: 'client:connect-session',
    LEAVE_SESSION: 'client:leave-session',
    PLAYER_ACTION: 'client:player-action',
    REQUEST_PROFILE: 'client:request-profile'
} as const;

export const ServerEvent = {
    SESSION_CREATE_RESPONSE: 'server:session-create-response',
    SESSION_JOIN_RESPONSE: 'server:session-join-response',
    SNAPSHOT: 'server:snapshot',
    ERROR: 'server:error',
    CLASS_PRESETS: 'server:class-presets',
    PLAYER_ID: 'server:player-id'
} as const;

export type ClientEventType = typeof ClientEvent[keyof typeof ClientEvent];
export type ServerEventType = typeof ServerEvent[keyof typeof ServerEvent];