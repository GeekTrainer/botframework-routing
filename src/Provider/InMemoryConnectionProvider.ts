import { ConversationReference } from 'botbuilder';
import { Connection } from '../Models/Connection';
import { ConnectionProvider } from './ConnectionProvider';
import { areSameConversation } from '../util';

export class InMemoryConnectionProvider implements ConnectionProvider {
    private connections: Connection[] = [];

    getConnections(): Promise<Connection[]> {
        return Promise.resolve(this.connections);
    }

    addConnection(connection: Connection): Promise<void> {
        this.connections.push(connection);
        return Promise.resolve();
    }

    addToConnection(existingRef: ConversationReference, refToAdd: ConversationReference): Promise<void> {
        const existingConnection = this.connections.find(c => areSameConversation(c.userReferences[0], existingRef));
        if (!existingConnection) {
            throw new Error('Connection does not exist');
        }

        existingConnection.userReferences[1] = refToAdd;
        return Promise.resolve();
    }

    endConnection(existingRef: ConversationReference): Promise<void> {       
        const existingConnectionIndex = this.connections.findIndex(c=> c.userReferences[0].conversation === (existingRef !== null && existingRef.conversation));
        //this.connections[existingConnectionIndex].userReferences[1] = null;               
        this.connections.slice(existingConnectionIndex);
        return Promise.resolve();
    }
}