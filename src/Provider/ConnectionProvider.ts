import { ConversationReference } from 'botbuilder';
import { Connection } from '../Models/Connection'

export interface ConnectionProvider {
    getConnections(): Promise<Connection[]>;
    addConnection(connection: Connection): Promise<void>;
    addToConnection(existingRef: ConversationReference, refToAdd: ConversationReference): Promise<void>;
    endConnection(existingRef: ConversationReference, refToDelete: ConversationReference): Promise<void>;
}