import { ConversationReference } from 'botbuilder';

export enum HandoffUserState {
    bot,
    queued,
    agent
}

export interface Message {
    from: string;
    text: string;
}

export interface HandoffUser {
    userReference: ConversationReference;
    messages: Message[];
    state: HandoffUserState;
    agentReference?: ConversationReference;
    queueTime?: Date;
}