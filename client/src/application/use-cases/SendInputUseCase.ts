import { IInputProvider } from '../interfaces/IInputProvider';
import { INetworkClient } from '../interfaces/INetworkClient';

export class SendInputUseCase {
    constructor(
        private inputProvider: IInputProvider,
        private networkClient: INetworkClient
    ) {}

    public execute(): void {
        this.inputProvider.startListening();
        this.inputProvider.onInputChanged((action) => {
            this.networkClient.sendPlayerAction(action);
        });
    }

    public stop(): void {
        this.inputProvider.stopListening();
    }
}