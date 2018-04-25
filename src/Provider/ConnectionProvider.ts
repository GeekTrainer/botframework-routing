import { ConversationReference } from 'botbuilder';
import { Connection } from '../Models/Connection'

export interface ConnectionProvider {
    getConnections(): Promise<Connection[]>;
}