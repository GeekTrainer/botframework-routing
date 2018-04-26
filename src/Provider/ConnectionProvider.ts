import { ConversationReference } from 'botbuilder';
import { PendingConnection, EstablishedConnection } from '../Models/Connection';

export interface ConnectionProvider {
    getPendingConnections(): Promise<PendingConnection[]>;
    getEstablishedConnections(): Promise<EstablishedConnection[]>;
    addPendingConnection(connection: PendingConnection): Promise<void>;
    addEstablishedConnection(connection: EstablishedConnection): Promise<void>;
    removeConnection(ref: ConversationReference): Promise<void>;
}