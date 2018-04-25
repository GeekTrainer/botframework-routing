import { ConversationReference } from 'botbuilder';

export interface ConnectionProvider {
    findConnectedTo(ref: Partial<ConversationReference>): Promise<ConversationReference | null>;
}