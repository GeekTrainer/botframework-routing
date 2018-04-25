import { ConversationReference } from 'botbuilder';
import { Connection } from '../Models/Connection';
import { ConnectionProvider } from './ConnectionProvider'

export class InMemoryConnectionProvider implements ConnectionProvider {
    private connections: Connection[] = [];

    getConnections(): Promise<Connection[]> {
        return Promise.resolve(this.connections);
    }
}