import sinon = require("sinon");
import { assert } from "chai";
import { InMemoryConnectionProvider } from "../Provider/InMemoryConnectionProvider";
import { PendingConnection, EstablishedConnection } from '../Models/Connection';
import { ConversationReference } from "botbuilder";
import { getConversationReference } from "./helpers";

describe("In Memory Provider manages users", () => {
    let provider: InMemoryConnectionProvider;

    let user1Reference = getConversationReference("user1", "user1");
    let user2Reference = getConversationReference("user2", "user2");

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

        assert(pending.length === 1);
    });

    it("Add a established connection", async () => {
        await provider.addEstablishedConnection({
            userReferences: [ user1Reference, user2Reference ]
        });

        let established = await provider.getEstablishedConnections();

        assert(established.length === 1);
    });

    it("End existing pending connection", async () => {
        await provider.addPendingConnection({
            userReference: user1Reference
        });
        await provider.endConnection(user1Reference);

        let pending = await provider.getPendingConnections();

        assert(pending.length === 0);
    });

    it("End an existing established connection between user 1 & user 2 using user 1", async () => {
        await provider.addEstablishedConnection({
            userReferences: [ user1Reference, user2Reference ]
        });
        await provider.endConnection(user1Reference);

        let established = await provider.getEstablishedConnections();

        assert(established.length === 0);
    });

    it("End an existing established connection between user 1 & user 2 using user 2", async () => {
        await provider.addEstablishedConnection({
            userReferences: [ user1Reference, user2Reference ]
        });
        await provider.endConnection(user2Reference);

        let established = await provider.getEstablishedConnections();

        assert(established.length === 0);
    });

    it("End non existing connection", async () => {
        await provider.endConnection(user1Reference);

        let pending = await provider.getPendingConnections();
        let established = await provider.getEstablishedConnections();

        assert(pending.length === 0 && established.length === 0);        
    });
});