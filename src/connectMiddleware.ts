import { ConversationReference, Middleware, TurnContext, ActivityTypes, Activity } from 'botbuilder';
import { ConnectionProvider } from './Provider/ConnectionProvider'
import { areSameConversation } from './util';

export class ConnectMiddleware implements Middleware {
    private provider: ConnectionProvider;

    public constructor(provider: ConnectionProvider) {
        this.provider = provider;
    }

    public async onTurn(context: TurnContext, next: () => Promise<void>): Promise<void> {
        // Only handle message activities
        if (context.activity.type !== ActivityTypes.Message || !context.activity.text) {
            return next();
        }

        // If already connected, forward the message
        const ref = TurnContext.getConversationReference(context.activity);
        const connected = await this.findConnectedTo(ref);
        if (connected !== null) {
            return context.adapter.continueConversation(connected, (forwardContext => {
                forwardContext.sendActivity(context.activity);
            }));
        }

        // Otherwise, continue the pipeline
        return next();
    }

    public async findConnectedTo(ref: Partial<ConversationReference>) {
        if (!ref.user) return Promise.resolve(null);

        const connections = await this.provider.getConnections();
        const matches = connections.filter(c => areSameConversation(c.userReferences[0], ref) || areSameConversation(c.userReferences[1], ref));

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

    public async startConnection(ref: Partial<ConversationReference>) {
        // Ensure we aren't already connected to someone
        const connected = await this.findConnectedTo(ref);
        if (connected !== null) {
            return false;
        }

        this.provider.addConnection({
            userReferences: [ref, null]
        });

        return true;
    }

    public async connectTo(self: ConversationReference, target: ConversationReference) {
        // Ensure we aren't already connected to someone
        const selfConnected = await this.findConnectedTo(self);
        if (selfConnected !== null) {
            return false;
        }

        // Ensure target isn't already connected to someone
        const targetConnected = await this.findConnectedTo(target);
        if (targetConnected !== null) {
            return false;
        }

        this.provider.addToConnection(target, self);

        return;
    }
}
