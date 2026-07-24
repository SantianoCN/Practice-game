export declare const ClientEvent: {
    readonly CREATE_SESSION: "client:create-session";
    readonly CREATE_LOBBY: "client:create-lobby";
    readonly CONNECT_LOBBY: "client:connect-lobby";
    readonly START_GAME: "client:start-game";
    readonly LEAVE_SESSION: "client:leave-session";
    readonly PLAYER_ACTION: "client:player-action";
    readonly REQUEST_PROFILE: "client:request-profile";
    readonly COMPLETE_SESSION: "client:complete-session";
    readonly BUY_ITEM: "client:buy-item";
    readonly NEXT_FLOOR: "client:next-floor";
    readonly RESTORE_SAVE: "client:restore-save";
    readonly SAVE_AND_EXIT: "client:save-and-exit";
};
export declare const ServerEvent: {
    readonly SESSION_CREATE_RESPONSE: "server:session-create-response";
    readonly SESSION_JOIN_RESPONSE: "server:session-join-response";
    readonly SNAPSHOT: "server:snapshot";
    readonly ERROR: "server:error";
    readonly CLASS_PRESETS: "server:class-presets";
    readonly PLAYER_ID: "server:player-id";
    readonly SYNC_PROGRESS: "server:sync-progress";
    readonly SESSION_COMPLETED: "server:session-completed";
    readonly SESSION_TERMINATED: "server:session-terminated";
    readonly PORTAL_INTERACT: "server:portal-interact";
    readonly ROOM_INIT: "server:room-init";
};
export type ClientEventType = typeof ClientEvent[keyof typeof ClientEvent];
export type ServerEventType = typeof ServerEvent[keyof typeof ServerEvent];
