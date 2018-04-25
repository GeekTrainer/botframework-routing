import { ConversationReference } from 'botbuilder';
import { HandoffUser } from '../Models/user';

export interface RoutingProvider {
    // HandoffUserManagement
    findOrCreate(userReference: ConversationReference): Promise<HandoffUser>;
    save(user: HandoffUser): Promise<void>;
    log(user: HandoffUser, from: string, text: string): Promise<HandoffUser>;

    // Connection management
    findByAgent(agentReference: ConversationReference): Promise<HandoffUser>;

    // Queue management
    queueForAgent(userReference: ConversationReference): Promise<HandoffUser>;
    unqueueForAgent(userReference: ConversationReference): Promise<HandoffUser>;
    connectToAgent(agentReference: ConversationReference): Promise<HandoffUser>;
    disconnectFromAgent(agentReference: ConversationReference): Promise<HandoffUser>;
    getQueue(): Promise<HandoffUser[]>;
}
