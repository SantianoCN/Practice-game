
export const ServerEvent = {
    SESSION_CREATE_RESPONSE: 'session-create-response',
    SESSION_JOIN_RESPONSE: 'session-join-response', 
    SNAPSHOT: 'snapshot',
    ERROR: 'error'
} as const;

export const ClientEvent = {
    CREATE_SESSION: 'create-session',
    CONNECT_SESSION: 'connect-session',
    PLAYER_ACTION: 'playerAction',  
} as const;

export type ServerEventType = typeof ServerEvent[keyof typeof ServerEvent];