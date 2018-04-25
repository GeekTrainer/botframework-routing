import { ConversationReference } from 'botbuilder';

export interface Connection {
    userReferences: [Partial<ConversationReference>, Partial<ConversationReference> | null]
}