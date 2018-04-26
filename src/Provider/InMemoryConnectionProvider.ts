import { PendingConnection, EstablishedConnection } from '../Models/Connection';
import { ConnectionProvider } from './ConnectionProvider';
import { ConversationReference } from 'botbuilder';

export class InMemoryConnectionProvider implements ConnectionProvider {
    private pendingConnections: PendingConnection[] = [];
    private establishedConnections: EstablishedConnection[] = [];

    getPendingConnections(): Promise<PendingConnection[]> {
        return Promise.resolve(this.pendingConnections);
    }

    getEstablishedConnections(): Promise<EstablishedConnection[]> {
        return Promise.resolve(this.establishedConnections);
    }

    addPendingConnection(connection: PendingConnection): Promise<void> {
        this.pendingConnections.push(connection);
        return Promise.resolve();
    }

    addEstablishedConnection(connection: EstablishedConnection): Promise<void> {
        this.establishedConnections.push(connection);
        return Promise.resolve();
    }

    endConnection(connection: ConversationReference): Promise<void> {  
        const pendingConnectionIndex = this.pendingConnections.findIndex(c=> 
            (c.userReference.conversation == connection.conversation));     
        const establishedConnectionIndex = this.establishedConnections.findIndex(c=> 
            (c.userReferences[0].conversation == connection.conversation) || 
            (c.userReferences[1].conversation == connection.conversation));
        
        if(pendingConnectionIndex !== -1){
            this.pendingConnections.splice(pendingConnectionIndex);
        }        
        if(establishedConnectionIndex !== -1){
            this.establishedConnections.splice(establishedConnectionIndex);
        }        

        return Promise.resolve();
    }
}