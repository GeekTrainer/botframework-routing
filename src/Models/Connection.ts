import { ConversationReference } from 'botbuilder';

export interface PendingConnection {
    userReference: Partial<ConversationReference>;
    data?: any;
}

export interface EstablishedConnection {
    userReferences: [Partial<ConversationReference>, Partial<ConversationReference>];
    data?: any;
}