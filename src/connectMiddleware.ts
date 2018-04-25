import { ConversationReference, Middleware, TurnContext, ActivityTypes, Activity } from 'botbuilder';

export interface Connection {
    userReferences: [ConversationReference, ConversationReference | null]
}

export interface ConnectionProvider {
    findConnectedTo(ref: Partial<ConversationReference>): Promise<ConversationReference | null>;
}

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
        const connected = await this.provider.findConnectedTo(ref);
        if (connected !== null) {
            return context.adapter.continueConversation(connected, (forwardContext => {
                forwardContext.sendActivity(context.activity);
            }));
        }

        // Otherwise, continue the pipeline
        return next();
    }
}
