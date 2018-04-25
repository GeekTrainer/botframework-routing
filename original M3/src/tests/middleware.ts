import { HandoffUserState, ArrayHandoffProvider, HandoffMiddleware, HandoffUser } from "../handoff-middleware";
import { ConversationReference, TurnContext, Activity } from "botbuilder";
import { CustomTestAdapter } from './helpers'
import sinon = require("sinon");
import { userReference, agentReference } from "./helpers";
import { assert } from "chai";

describe("Agent management", () => {
    let next: sinon.SinonStub;

    const getProvider = (state: HandoffUserState, agentReference: ConversationReference = null) => {
        let provider = sinon.createStubInstance<ArrayHandoffProvider>(ArrayHandoffProvider);
        switch(state) {
            case HandoffUserState.queued:
                provider.getQueue.returns([{
                    userReference: userReference,
                    messages: [],
                    state: HandoffUserState.queued,
                    queueTime: new Date()
                }]);
                provider.connectToAgent.returns({
                    userReference: userReference,
                    messages: [],
                    state: HandoffUserState.agent
                });
                break;
            case HandoffUserState.agent:
                provider.findByAgent.returns({
                    userReference: userReference,
                    message: [],
                    state: HandoffUserState.agent,
                    agentReference: agentReference
                });
                break;                        
        }
        return provider;
    }

    beforeEach(() => {
        next = sinon.stub();
    });

    it("Logs messages from agent when connected to user", async () => {
        const adapter = new CustomTestAdapter((context: TurnContext) => Promise.resolve());
        const activity = { type: "message", text: "Hi there", from: agentReference.user } as Activity;
        const context = new TurnContext(adapter, activity);
        const provider = getProvider(HandoffUserState.agent, agentReference);

        await new HandoffMiddleware(provider).onTurn(context, next);

        assert(provider.log.calledWith(provider.findByAgent(agentReference), agentReference.user.name, "Hi there"), "Log not called");
    });

    it("Routes message to bot when agent not connected", async () => {
        const adapter = new CustomTestAdapter((context: TurnContext) => Promise.resolve());
        const activity = { type: "message", text: "Hi there", from: agentReference.user } as Activity;
        const context = new TurnContext(adapter, activity);
        const provider = getProvider(HandoffUserState.bot);

        await new HandoffMiddleware(provider).onTurn(context, next);

        assert(next.called, "next not called");
    });

    it("Agent can list queue", async () => {
        const adapter = new CustomTestAdapter((context: TurnContext) => Promise.resolve());
        const activity = { type: "message", text: "#list", from: agentReference.user } as Activity;
        const context = new TurnContext(adapter, activity);
        const provider = getProvider(HandoffUserState.queued);

        await new HandoffMiddleware(provider).onTurn(context, next);

        assert(provider.getQueue.called, "getQueue not called");
        assert(next.notCalled, "next called");
        assert(adapter.activityBuffer.length === 1, "Wrong number of responses");
        assert(adapter.activityBuffer[0].text.indexOf(userReference.user.name) > -1, "Name not listed")
    });

    it("Agent can connect to longest waiting user", async () => {
        const adapter = new CustomTestAdapter((context: TurnContext) => Promise.resolve());
        const activity = { type: "message", text: "#connect", from: agentReference.user } as Activity;
        const context = new TurnContext(adapter, activity);
        const provider = getProvider(HandoffUserState.queued);

        await new HandoffMiddleware(provider).onTurn(context, next);

        assert(next.notCalled, "next called");
        assert(adapter.activityBuffer.length === 1, "Wrong number of responses");
        assert(adapter.activityBuffer[0].text.indexOf(userReference.user.name) > -1, "Name not listed")
    });

    it("Agent receives error when calling connect when connected", async () => {
        const adapter = new CustomTestAdapter((context: TurnContext) => Promise.resolve());
        const activity = { type: "message", text: "#connect", from: agentReference.user } as Activity;
        const context = new TurnContext(adapter, activity);        
        const provider = getProvider(HandoffUserState.agent);

        await new HandoffMiddleware(provider).onTurn(context, next);

        assert(adapter.activityBuffer.length === 1, "Wrong number of responses");
        assert(adapter.activityBuffer[0].text === "Command not valid when connected to user.", "wrong message");
        assert(next.notCalled, "next was called");
    });

    it("Sends error message when no users are queued", async () => {
        const adapter = new CustomTestAdapter((context: TurnContext) => Promise.resolve());
        const activity = { type: "message", text: "#connect", from: agentReference.user } as Activity;
        const context = new TurnContext(adapter, activity);        
        const provider = getProvider(HandoffUserState.bot);

        await new HandoffMiddleware(provider).onTurn(context, next);

        assert(adapter.activityBuffer.length === 1, "Wrong number of responses");
        assert(adapter.activityBuffer[0].text === "Nobody in the queue.", "wrong message");
        assert(next.notCalled, "next was called");
    });

    it("Routes messages to user when connected", async () => {
        const adapter = new CustomTestAdapter((context: TurnContext) => Promise.resolve());
        const activity = { type: "message", text: "Hello user!", from: agentReference.user } as Activity;
        const context = new TurnContext(adapter, activity);        
        const provider = getProvider(HandoffUserState.agent);
        var conversationReference = TurnContext.getConversationReference(context.activity);
        const user = provider.findByAgent(conversationReference);
        const createContextSpy = sinon.spy(context.adapter, "continueConversation")

        await new HandoffMiddleware(provider).onTurn(context, next);

        assert(createContextSpy.calledWith(user.userReference), "createContext not called with correct reference");
        assert(adapter.activityBuffer.length === 1, "Wrong number of responses");
        assert(adapter.activityBuffer[0].text === "Hello user!", "Wrong message");
        assert(provider.findByAgent.called, "findByAgent not called");
        assert(next.notCalled, "next called");
    });

    it("Disconnects user", async () => {
        const adapter = new CustomTestAdapter((context: TurnContext) => Promise.resolve());
        const activity = { type: "message", text: "#disconnect", from: agentReference.user } as Activity;
        const context = new TurnContext(adapter, activity);      
        const provider = getProvider(HandoffUserState.agent);

        await new HandoffMiddleware(provider).onTurn(context, next);

        assert(provider.disconnectFromAgent.called, "Disconnect not called");
        assert(adapter.activityBuffer.length === 1, "No messages received");
        assert(adapter.activityBuffer[0].text === "Reconnected to bot", "wrong message");
        assert(next.notCalled, "next called");
    });
});

describe("User management", () => {
    let next: sinon.SinonStub;
   
    const createUser = (state: HandoffUserState) => {
        return {
            userReference,
            agentReference,
            messages: [],
            state
        } as HandoffUser   
    }

    beforeEach(() => {
        next = sinon.stub();
    });

    it("Logs messages", async () => {
        const next = sinon.stub();
        const provider = sinon.createStubInstance<ArrayHandoffProvider>(ArrayHandoffProvider);
        provider.findOrCreate.returns(createUser(HandoffUserState.bot));
        provider.log.returns(createUser(HandoffUserState.bot));

        const adapter = new CustomTestAdapter((context: TurnContext) => Promise.resolve());
        const activity = { type: "message", text: "Let's log", from: userReference.user } as Activity;
        const context = new TurnContext(adapter, activity);      

        await new HandoffMiddleware(provider).onTurn(context, next);

        assert(provider.log.called, "Log not called");
    });

    it("Adds user to queue", async () => {
        const next = sinon.stub();
        const provider = sinon.createStubInstance<ArrayHandoffProvider>(ArrayHandoffProvider);
        provider.findOrCreate.returns(createUser(HandoffUserState.bot));

        const adapter = new CustomTestAdapter((context: TurnContext) => Promise.resolve());
        const activity = { type: "message", text: "agent", from: userReference.user } as Activity;
        const context = new TurnContext(adapter, activity);      

        await new HandoffMiddleware(provider).onTurn(context, next);

        assert(provider.findOrCreate.calledWith(userReference), "findOrCreate not called");
        assert(provider.queueForAgent.calledWith(userReference), "queueForAgent not called");
        assert(adapter.activityBuffer[0].text === "Waiting for agent", "Wrong message");
    });

    it("Removes user from queue", async () => {
        const next = sinon.stub();
        const provider = sinon.createStubInstance<ArrayHandoffProvider>(ArrayHandoffProvider);
        provider.findOrCreate.returns(createUser(HandoffUserState.queued));

        const adapter = new CustomTestAdapter((context: TurnContext) => Promise.resolve());
        const activity = { type: "message", text: "cancel", from: userReference.user } as Activity;
        const context = new TurnContext(adapter, activity);      

        await new HandoffMiddleware(provider).onTurn(context, next);

        assert(provider.findOrCreate.calledWith(userReference), "findOrCreate not called");
        assert(provider.unqueueForAgent.calledWith(userReference), "unqueueForAgent not called");
        assert(adapter.activityBuffer[0].text === "Connected to bot", "wrong message");
    });

    it("Routes messages to agent when connected", async () => {
        const next = sinon.stub();
        const provider = sinon.createStubInstance<ArrayHandoffProvider>(ArrayHandoffProvider);
        provider.findByAgent.returns(createUser(HandoffUserState.agent));
        provider.findOrCreate.returns(createUser(HandoffUserState.agent));

        const adapter = new CustomTestAdapter((context: TurnContext) => Promise.resolve());
        const activity = { type: "message", text: "Hello, agent", from: userReference.user } as Activity;
        const context = new TurnContext(adapter, activity);      
        
        const createContextSpy = sinon.spy(context.adapter, "continueConversation");

        await (new HandoffMiddleware(provider)).onTurn(context, next);

        assert(provider.findOrCreate.called, "findOrCreate not called");
        assert(createContextSpy.calledWith(createUser(HandoffUserState.queued).agentReference), "Create context not called");
        assert(adapter.activityBuffer[0].text = "Hello, agent", "Message incorrect");
    });
});