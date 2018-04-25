import { ConversationReference } from 'botbuilder';

export interface Connection {
    userReferences: [ConversationReference, ConversationReference | null]
}