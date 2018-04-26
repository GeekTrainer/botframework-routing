import { ConversationReference, ChannelAccount, TestAdapter, TurnContext, Promiseable, Activity } from "botbuilder";

export class CustomTestAdapter extends TestAdapter {
    public continueConversation(reference: Partial<ConversationReference>, logic: (revocableContext: TurnContext) => Promiseable<void>): Promise<void> {
        // TestAdapter does this: return Promise.reject(new Error(`not implemented`));
        // So tests fail as we call continueConversation in handoff-middleware
        const context = new TurnContext(this, reference);
        return logic(context) as Promise<void>;
    }
}

<<<<<<< HEAD
export const getConversationReference = (conversationId: string, userId: string, userName: string) => {
    return TurnContext.getConversationReference( { 
        from: { id: userId, name: userName }, 
        conversation: { id: conversationId }
    } as Activity ) as ConversationReference;
}
=======
export const getConversationReference = (id: string, name: string) => {
    return TurnContext.getConversationReference( { from: { id, name } } as Activity ) as ConversationReference;
};
>>>>>>> 4239b1be26217c7a1ff257f67e170abd2fce230b
