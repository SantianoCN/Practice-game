"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerEvent = exports.ClientEvent = void 0;
exports.ClientEvent = {
    CREATE_SESSION: 'client:create-session',
    CREATE_LOBBY: 'client:create-lobby',
    CONNECT_LOBBY: 'client:connect-lobby',
    START_GAME: 'client:start-game',
    LEAVE_SESSION: 'client:leave-session',
    PLAYER_ACTION: 'client:player-action',
    REQUEST_PROFILE: 'client:request-profile'
};
exports.ServerEvent = {
    SESSION_CREATE_RESPONSE: 'server:session-create-response',
    SESSION_JOIN_RESPONSE: 'server:session-join-response',
    SNAPSHOT: 'server:snapshot',
    ERROR: 'server:error',
    CLASS_PRESETS: 'server:class-presets',
    PLAYER_ID: 'server:player-id'
};
