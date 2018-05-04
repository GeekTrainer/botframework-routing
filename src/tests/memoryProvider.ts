import sinon = require("sinon");
import { assert } from "chai";
import { InMemoryConnectionProvider } from "../Provider/InMemoryConnectionProvider";
import { getConversationReference } from "./helpers";

describe("In Memory Provider manages users", () => {
    let provider: InMemoryConnectionProvider;

    let user1Reference = getConversationReference("conversation1", "user1", "user1");
    let user2Reference = getConversationReference("conversation2", "user2", "user2");
    let user3Reference = getConversationReference("conversation3", "user3", "user3");

    beforeEach(() => {
        provider = new InMemoryConnectionProvider();
    });

    it("Get no pending connections", async () => {
        let pending = await provider.getPendingConnections();

        assert(pending.length === 0);
    });

    it("Get no established connections", async () => {
        let established = await provider.getEstablishedConnections();

        assert(established.length === 0);
    });

    it("Add a pending connection", async () => {        
        await provider.addPendingConnection({
            userReference: user1Reference
        });

        let pending = await provider.getPendingConnections();

        assert(pending.length === 1 && 
            pending[0].userReference == user1Reference);
    });

    it("Add a established connection", async () => {
        await provider.addEstablishedConnection({
            userReferences: [ user1Reference, user2Reference ]
        });

        let established = await provider.getEstablishedConnections();

        assert(established.length === 1 && 
            established[0].userReferences[0] == user1Reference && 
            established[0].userReferences[1] == user2Reference);
    });

    it("End existing pending connection", async () => {
        await provider.addPendingConnection({
            userReference: user1Reference
        });
        await provider.removeConnection(user1Reference);

        let pending = await provider.getPendingConnections();

        assert(pending.length === 0);
    });

    it("End an existing established connection between user 1 & user 2 using user 1", async () => {
        await provider.addEstablishedConnection({
            userReferences: [ user1Reference, user2Reference ]
        });
        await provider.removeConnection(user1Reference);

        let established = await provider.getEstablishedConnections();

        assert(established.length === 0);
    });

    it("End an existing established connection between user 1 & user 2 using user 2", async () => {
        await provider.addEstablishedConnection({
            userReferences: [ user1Reference, user2Reference ]
        });
        await provider.removeConnection(user2Reference);

        let established = await provider.getEstablishedConnections();

        assert(established.length === 0);
    });

    it("End non existing pending connection", async () => {
        await provider.addPendingConnection({
            userReference: user1Reference
        });
        await provider.removeConnection(user2Reference);

        let pending = await provider.getPendingConnections();

        assert(pending.length === 1 && 
            pending[0].userReference == user1Reference);
    });

    it("End non existing established connection", async () => {
        await provider.addEstablishedConnection({
            userReferences: [ user1Reference, user2Reference ]
        });
        await provider.removeConnection(user3Reference);

        let established = await provider.getEstablishedConnections();

        assert(established.length === 1 && 
            established[0].userReferences[0] == user1Reference && 
            established[0].userReferences[1] == user2Reference);
    });

    it("End non existing connection when no connections", async () => {
        await provider.removeConnection(user1Reference);

        let pending = await provider.getPendingConnections();
        let established = await provider.getEstablishedConnections();

        assert(pending.length === 0 && established.length === 0);        
    });
});