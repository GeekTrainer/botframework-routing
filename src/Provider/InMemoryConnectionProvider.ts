import { ConversationReference } from 'botbuilder';
import { Connection } from '../Models/Connection';
import { ConnectionProvider } from './ConnectionProvider';

function areSameConversation(ref1: Partial<ConversationReference> | null, ref2: Partial<ConversationReference> | null) {
    return ref1 && ref2
        && ref1.user && ref2.user
        && ref1.user.id === ref2.user.id
        && ref1.conversation && ref2.conversation
        && ref1.conversation.id === ref2.conversation.id
        && ref1.channelId === ref2.channelId;
}

export class InMemoryConnectionProvider implements ConnectionProvider {
    private connections: Connection[] = [];

    public findConnectedTo(ref: Partial<ConversationReference>) {
        if (!ref.user) { return Promise.resolve(null); }

        const matches = this.connections.filter(c => areSameConversation(c.userReferences[0], ref) || areSameConversation(c.userReferences[1], ref));

        // Make sure the user isn't part of multiple connections
        if (matches.length >= 2) {
            throw new Error('Multiple connections not allowed');
        }

        // Find which end of the connection the user is, and return the other end
        if (matches.length === 1) {
            if (areSameConversation(matches[0].userReferences[0], ref)) {
                return Promise.resolve(matches[0].userReferences[1]);
            }
            if (areSameConversation(matches[0].userReferences[1], ref)) {
                return Promise.resolve(matches[0].userReferences[0]);
            }
        }

        // Not connected
        return Promise.resolve(null);
    }
}