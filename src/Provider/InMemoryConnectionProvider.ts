import { PendingConnection, EstablishedConnection } from '../Models/Connection';
import { ConnectionProvider } from './ConnectionProvider';
import { ConversationReference } from 'botbuilder';
import { areSameConversation } from '../util';

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

    endConnection(ref: ConversationReference): Promise<void> {  
        const pendingConnectionIndex = this.pendingConnections.findIndex(c=> 
            areSameConversation(c.userReference,ref));     
        const establishedConnectionIndex = this.establishedConnections.findIndex(c=> 
            areSameConversation(c.userReferences[0],ref) || areSameConversation(c.userReferences[1],ref));
        
        if(pendingConnectionIndex !== -1){
            this.pendingConnections.splice(pendingConnectionIndex,1);
        }        
        if(establishedConnectionIndex !== -1){
            this.establishedConnections.splice(establishedConnectionIndex,1);
        }             

        return Promise.resolve();
    }
}