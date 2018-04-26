import { PendingConnection, EstablishedConnection } from '../Models/Connection';
import { ConnectionProvider } from './ConnectionProvider';

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
}