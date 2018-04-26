import { ConversationReference, Middleware, TurnContext, ActivityTypes } from 'botbuilder';
import { ConnectionProvider } from './Provider/ConnectionProvider'
import { areSameConversation } from './util';

export class ConnectMiddleware implements Middleware {
    private provider: ConnectionProvider;

    public constructor(provider: ConnectionProvider) {
        this.provider = provider;
    }

    public async onTurn(context: TurnContext, next: () => Promise<void>): Promise<void> {
        // Only handle message activities
        // TODO: what other message types should be forwarded? maybe configurable?
        if (context.activity.type !== ActivityTypes.Message || !context.activity.text) {
            return next();
        }

        // If already connected, forward the message and stop the pipeline
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
        if (!ref.user) throw new Error('User object is undefined');

        // Find established connections that the user is part of
        const connections = await this.provider.getEstablishedConnections();
        const matches = connections.filter(c => areSameConversation(c.userReferences[0], ref) || areSameConversation(c.userReferences[1], ref));

        // Ensure the user isn't part of multiple connections
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

    // Start a pending connection (i.e. add user to the "waiting" pool)
    public async startConnection(ref: Partial<ConversationReference>) {
        // Ensure we don't already have a connection
        if (await this.isPending(ref) || await this.isEstablished(ref)) {
            throw new Error('Connection already exists');
        }

        return this.provider.addPendingConnection({
            userReference: ref
        });
    }

    // Establish an already pending connection (i.e. join to the other end of a pending connection)
    public async connectTo(self: ConversationReference, target: ConversationReference) {
        // Ensure self isn't already connected to someone
        if (await this.isPending(self) || await this.isEstablished(self)) {
            throw new Error('Connection already exists for self');
        }

        // Find target's pending connection
        const allPending = await this.provider.getPendingConnections();
        const pending = allPending.find(c => areSameConversation(c.userReference, target));
        if (!pending) {
            throw new Error('Pending connection does not exist for target');
        }

        // Remove target's pending connection
        await this.provider.removeConnection(target);

        // Add a new established connection
        return this.provider.addEstablishedConnection({
            userReferences: [target, self]
        });
    }

    public async endConnection(ref: ConversationReference): Promise<void> {          
        // Ensure we already have a connection
        if (!(await this.isPending(ref) || await this.isEstablished(ref))) {
            throw new Error('Connection does not exist');
        }
        return this.provider.removeConnection(ref);        
    }

    private async isPending(ref: Partial<ConversationReference>): Promise<boolean> {
        const pending = await this.provider.getPendingConnections();
        return pending.some(c => areSameConversation(c.userReference, ref));
    }

    private async isEstablished(ref: Partial<ConversationReference>): Promise<boolean> {
        const est = await this.provider.getEstablishedConnections();
        return est.some(c => areSameConversation(c.userReferences[0], ref) || areSameConversation(c.userReferences[1], ref));
    }
}
