import { ConversationReference } from 'botbuilder';

export function areSameConversation(ref1: Partial<ConversationReference> | null, ref2: Partial<ConversationReference> | null): boolean {
    return (ref1 !== null && ref2 !== null
        && ref1.user !== undefined && ref2.user !== undefined
        && (ref1.user.id === ref2.user.id)
        && ref1.conversation !== undefined && ref2.conversation !== undefined
        && (ref1.conversation.id === ref2.conversation.id)
        && (ref1.channelId === ref2.channelId));
}