import { ConversationReference } from 'botbuilder';
import { ConnectionProvider, Connection } from './connectMiddleware';

function areSameUser(ref1: Partial<ConversationReference> | null, ref2: Partial<ConversationReference> | null) {
    return ref1 && ref1.user && ref2 && ref2.user && ref1.user.id === ref2.user.id;
}

export class ArrayConnectionProvider implements ConnectionProvider {
    private connections: Connection[] = [];

    findConnectedTo(ref: Partial<ConversationReference>) {
        if (!ref.user) return Promise.resolve(null);
        
        const matches = this.connections.filter(c => areSameUser(c.userReferences[0], ref) || areSameUser(c.userReferences[1], ref));

        // Make sure the user isn't part of multiple connections
        if (matches.length >= 2) {
            throw new Error('Multiple connections not allowed');
        }

        // Find which end of the connection the user is, and return the other end
        if (matches.length === 1) {
            if (areSameUser(matches[0].userReferences[0], ref)) {
                return Promise.resolve(matches[0].userReferences[1]);
            }
            if (areSameUser(matches[0].userReferences[1], ref)) {
                return Promise.resolve(matches[0].userReferences[0]);
            }
        }

        // Not connected
        return Promise.resolve(null);
    }
}