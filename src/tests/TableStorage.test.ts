import * as sinon from 'sinon';
import { assert } from "chai";
import { InMemoryConnectionProvider } from "../Provider/InMemoryConnectionProvider";
import { PendingConnection, EstablishedConnection } from '../Models/Connection';
import { ConversationReference } from "botbuilder";
import { getConversationReference } from "./helpers";
import { TableStorageConnectionProvider } from '../Provider/TableStorageConnectionProvider';

describe("Table Storage Connection Provider manages users", () => {
    let provider: TableStorageConnectionProvider;

    const user1Reference = getConversationReference("conversation1", "user1", "user1");
    const user2Reference = getConversationReference("converstaion2", "user2", "user2");

    beforeEach(() => {
        provider = new TableStorageConnectionProvider({
            storageAccountOrConnectionString: 'UseDevelopmentStorage=true',
            storageAccessKey: '',
            tableName: 'Connections'
            //host?: azure.StorageHost;
        });
    });

    it("Get no pending connections", async () => {
        const pending = await provider.getPendingConnections();

        assert(pending.length === 0);
    });

    it("Get no established connections", async () => {
        const established = await provider.getEstablishedConnections();

        assert(established.length === 0);
    });

    it("Add a pending connection", async () => {
        await provider.addPendingConnection({
            userReference: user1Reference
        });

        const pending = await provider.getPendingConnections();

        assert(pending.length === 1);
    });

    it("Add a established connection", async () => {
        await provider.addEstablishedConnection({
            userReferences: [user1Reference, user2Reference]
        });

        const established = await provider.getEstablishedConnections();

        assert(established.length === 1);
    });

    it("End existing pending connection", async () => {
        await provider.addPendingConnection({
            userReference: user1Reference
        });
        await provider.endConnection(user1Reference);

        const pending = await provider.getPendingConnections();

        assert(pending.length === 0);
    });

    it("End an existing established connection between user 1 & user 2 using user 1", async () => {
        await provider.addEstablishedConnection({
            userReferences: [user1Reference, user2Reference]
        });
        await provider.endConnection(user1Reference);

        const established = await provider.getEstablishedConnections();

        assert(established.length === 0);
    });

    it("End an existing established connection between user 1 & user 2 using user 2", async () => {
        await provider.addEstablishedConnection({
            userReferences: [user1Reference, user2Reference]
        });
        await provider.endConnection(user2Reference);

        const established = await provider.getEstablishedConnections();

        assert(established.length === 0);
    });

    it("End non existing connection", async () => {
        await provider.endConnection(user1Reference);

        const pending = await provider.getPendingConnections();
        const established = await provider.getEstablishedConnections();

        assert(pending.length === 0 && established.length === 0);
    });
});