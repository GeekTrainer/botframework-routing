import { Middleware, TurnContext, ActivityTypes, ConversationReference, ChannelAccount, ConversationAccount, Activity } from 'botbuilder'

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

export class HandoffMiddleware implements Middleware {
    private _provider: HandoffProvider;
    get provider(): HandoffProvider {
        return this._provider;
    }

    public constructor(provider: HandoffProvider) {
        this._provider = provider;
    }

    public async onTurn(context: TurnContext, next: () => Promise<void>): Promise<void> {
        if (!context.activity || context.activity.type !== "message" || !context.activity.text) {
            return next();
        }

        var conversationReference = TurnContext.getConversationReference(context.activity);
        if (conversationReference &&
            conversationReference.user &&
            conversationReference.user.name.toLocaleLowerCase().startsWith("agent")
        ) {
            return this.manageAgent(context, next)
        } else {
            return this.manageUser(context, next);
        }
    }

    private async manageUser(context: TurnContext, next: () => Promise<void>) {
        var conversationReference = TurnContext.getConversationReference(context.activity);
        const user = await this.provider.findOrCreate(conversationReference);
        this.provider.log(user, user.userReference.user.name, context.activity.text);

        if(user.state === HandoffUserState.agent) {
            return context.adapter.continueConversation(user.agentReference, (agentContext) => {
                agentContext.sendActivity(context.activity.text);
            });
        }

        switch (context.activity.text.toLowerCase()) {
            // check for command
            case "agent":
                await this.provider.queueForAgent(conversationReference);
                context.sendActivity("Waiting for agent");
                return Promise.resolve();
            case "cancel":
                await this.provider.unqueueForAgent(conversationReference);
                context.sendActivity("Connected to bot");
                return Promise.resolve();
        }

        return next();
    }

    private async manageAgent(context: TurnContext, next: () => Promise<void>) {
        const text = context.activity.text.toLowerCase();
        var conversationReference = TurnContext.getConversationReference(context.activity);

        // check if connected to user
        const connectedUser = await this.provider.findByAgent(conversationReference);
        if(!connectedUser && text.indexOf("#") !== 0) return next();

        if (connectedUser) {
            // route message
            if (text === "#disconnect") {
                await this.provider.disconnectFromAgent(conversationReference);
                context.sendActivity("Reconnected to bot");
                return Promise.resolve();
            } else if (text.indexOf("#") === 0) {
                context.sendActivity("Command not valid when connected to user.");
                return Promise.resolve();
            } else {
                this.provider.log(connectedUser, conversationReference.user.name, context.activity.text);
                return context.adapter.continueConversation(connectedUser.userReference, (userContext) => {
                    userContext.sendActivity(context.activity.text);
                });
            }
        }

        // check for command
        switch (text.substring(1)) {
            case "list":
                const currentQueue = await this.provider.getQueue();
                let message = "";
                currentQueue.forEach(u => message += "- " + u.userReference.user.name + "\n\n");
                context.sendActivity(message);
                return;
            case "connect":
                // TODO: Reject if already connected
                const handoffUser = await this.provider.connectToAgent(conversationReference);
                if (handoffUser) {
                    context.sendActivity("Connected to " + handoffUser.userReference.user.name);
                } else {
                    context.sendActivity("Nobody in the queue.");
                }
                return;
        }
    }
}

export interface HandoffProvider {
    // HandoffUserManagement
    findOrCreate(userReference: Partial<ConversationReference>): Promise<HandoffUser>;
    save(user: HandoffUser): Promise<void>;
    log(user: HandoffUser, from: string, text: string): Promise<HandoffUser>;

    // Connection management
    findByAgent(agentReference: Partial<ConversationReference>): Promise<HandoffUser>;

    // Queue management
    queueForAgent(userReference: Partial<ConversationReference>): Promise<HandoffUser>;
    unqueueForAgent(userReference: Partial<ConversationReference>): Promise<HandoffUser>;
    connectToAgent(agentReference: Partial<ConversationReference>): Promise<HandoffUser>;
    disconnectFromAgent(agentReference: Partial<ConversationReference>): Promise<HandoffUser>;
    getQueue(): Promise<HandoffUser[]>;
}

export class ArrayHandoffProvider implements HandoffProvider {
    backingStore: HandoffUser[];

    constructor(backingStore: HandoffUser[] = []) {
        this.backingStore = backingStore;
    }

    // HandoffUser management
    async findOrCreate(userReference: ConversationReference) {
        const results = this.backingStore.filter(u => u.userReference.user.id === userReference.user.id);
        if (results.length > 0) {
            return Promise.resolve(results[0]);
        } else {
            const user: HandoffUser = {
                userReference: userReference,
                state: HandoffUserState.bot,
                messages: []
            };
            this.backingStore.unshift(user);
            await this.save(user);
            return Promise.resolve(user);
        }
    }

    save(user: HandoffUser) {
        // Array doesn't need to be updated if object changes
        return Promise.resolve();
    }

    async log(user: HandoffUser, from: string, text: string) {
        user.messages.unshift({ from, text });
        await this.save(user);
        return Promise.resolve(user);
    }

    findByAgent(agentReference: ConversationReference) {
        const result = this.backingStore.filter(u => u.agentReference && u.agentReference.user.id === agentReference.user.id);
        if (result.length > 0) return Promise.resolve(result[0]);
        else return Promise.resolve(null);
    }

    // Queue management
    async queueForAgent(userReference: ConversationReference) {
        const user = await this.findOrCreate(userReference);
        user.state = HandoffUserState.queued;
        user.queueTime = new Date();
        await this.save(user);
        return Promise.resolve(user);
    }

    async unqueueForAgent(userReference: ConversationReference) {
        const user = await this.findOrCreate(userReference);
        user.state = HandoffUserState.bot;
        user.queueTime = null;
        await this.save(user);
        return Promise.resolve(user);
    }

    async connectToAgent(agentReference: ConversationReference) {
        const results = this.backingStore.sort(u => u.queueTime.getTime());
        if (results.length > 0) {
            const user = results[0];
            user.queueTime = null;
            user.state = HandoffUserState.agent;
            user.agentReference = agentReference;
            await this.save(user);
            return Promise.resolve(user);
        } else {
            return Promise.resolve(null);
        }
    }

    async disconnectFromAgent(agentReference: ConversationReference) {
        const user = await this.findByAgent(agentReference);
        user.state = HandoffUserState.bot;
        user.queueTime = null;
        await this.save(user);
        return Promise.resolve(user);
    }

    getQueue() {
        return Promise.resolve(this.backingStore.filter(u => u.state === HandoffUserState.queued));
    }
}
