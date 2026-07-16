import { PlayerActionDTO } from '@game/shared';

export interface IInputProvider {
    startListening(): void;
    stopListening(): void;
    onInputChanged(callback: (action: PlayerActionDTO) => void): void;
}