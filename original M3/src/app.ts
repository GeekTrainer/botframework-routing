import { BotFrameworkAdapter, TestAdapter, MemoryStorage } from 'botbuilder';
import * as restify from 'restify';
import { HandoffMiddleware, ArrayHandoffProvider } from './handoff-middleware';

// Create server
let server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log(`${server.name} listening to ${server.url}`);
});

// Create adapter and listen to servers '/api/messages' route.
const adapter = new BotFrameworkAdapter({ 
    appId: process.env.MICROSOFT_APP_ID, 
    appPassword: process.env.MICROSOFT_APP_PASSWORD 
});

// Human handoff
var provider = new ArrayHandoffProvider();
adapter.use(new HandoffMiddleware(provider));

// Listen for incoming requests 
server.post('/api/messages', (req, res) => {
    // Route received request to adapter for processing
    adapter.processActivity(req, res, async (context) => {
        if (context.activity.type === 'message') {
            await context.sendActivity(`Hello World`);
        }
    });
});