import { ConversationReference, ChannelAccount } from "botbuilder";

export const getConversationReference = (id: string, name: string) => {
    return { user: { id, name } } as ConversationReference;
}

export const userReference = getConversationReference("user", "user");

export const agentReference = getConversationReference("agent", "agent");

