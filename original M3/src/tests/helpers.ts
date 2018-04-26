import { ConversationReference, ChannelAccount, TestAdapter, TurnContext, Promiseable, Activity } from "botbuilder";

export class CustomTestAdapter extends TestAdapter {
    public continueConversation(reference: Partial<ConversationReference>, logic: (revocableContext: TurnContext) => Promiseable<void>): Promise<void> {
        // TestAdapter does this: return Promise.reject(new Error(`not implemented`));
        // So tests fail as we call continueConversation in handoff-middleware        
        var context = new TurnContext(this, reference);
        return logic(context) as Promise<void>;  
    }
}

export const getConversationReference = (id: string, name: string) => {
    return TurnContext.getConversationReference( { from: { id, name } } as Activity ) as ConversationReference;
}

export const userReference = getConversationReference("user", "user");

export const agentReference = getConversationReference("agent", "agent");


