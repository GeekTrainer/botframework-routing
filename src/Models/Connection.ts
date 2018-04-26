import { ConversationReference } from 'botbuilder';

export interface PendingConnection {
    userReference: Partial<ConversationReference>;
}

export interface EstablishedConnection {
    userReferences: [Partial<ConversationReference>, Partial<ConversationReference>];
}