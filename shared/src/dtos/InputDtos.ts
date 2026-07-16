import { z } from 'zod';
import * as schemas from '../schemas/InputSchemas';

export type LoginDataDTO = z.infer<typeof schemas.LoginDataSchema>;
export type TokenRequestDTO = z.infer<typeof schemas.TokenRequestSchema>;
export type SessionCreateRequestDTO = z.infer<typeof schemas.SessionCreateRequestSchema>;
export type SessionJoinRequestDTO = z.infer<typeof schemas.SessionJoinRequestSchema>;
export type PlayerActionDTO = z.infer<typeof schemas.PlayerActionSchema>;

export interface BaseResponseDTO {
    success: boolean;
    message?: string;
}

export interface LoginResponseDTO extends BaseResponseDTO {
    refreshToken?: string;
    login?: string;
}

export interface LogoutResponseDTO extends BaseResponseDTO {}

export interface SessionCreateResponseDTO extends BaseResponseDTO {
    sessionId?: string;
}

export interface SessionJoinResponseDTO extends BaseResponseDTO {
    sessionId?: string;
}

export interface ProfileResponseDTO extends BaseResponseDTO {
    login?: string;
}