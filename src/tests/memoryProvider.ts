import sinon = require("sinon");
import { assert } from "chai";
import { InMemoryConnectionProvider } from "../Provider/InMemoryConnectionProvider";
import { ConversationReference } from "botbuilder";
import { userReference, agentReference } from "./helpers";

describe("Provider manages users", () => {
    let provider: InMemoryConnectionProvider;
    const sandbox = sinon.createSandbox();

    beforeEach(() => {
        provider = new InMemoryConnectionProvider();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it("Get no pending connections", async () => {
        let pending = await provider.getPendingConnections();

        assert(pending.length === 0);
    });
});