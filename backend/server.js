const express = require('express');
const cors = require('cors');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
const { 
    AIProjectsClient,
    DoneEvent,
    ErrorEvent,
    isOutputOfType,
    MessageStreamEvent,
    RunStreamEvent,
    ToolUtility,
} = require('@azure/ai-projects');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Azure Key Vault Configuration
const keyVaultName = process.env.KEYVAULT_NAME;
const keyVaultUrl = `https://${keyVaultName}.vault.azure.net`;
const credential = new DefaultAzureCredential();
const secretClient = new SecretClient(keyVaultUrl, credential);

// AI Projects Configuration
let AI_CONNECTION_STRING = '';
let aiProjectsClient = null;
let agent = null;

// Retrieve AI Connection String from Key Vault and initialize client
async function initializeAI() {
    try {
        // Get connection string from Key Vault
        const secret = await secretClient.getSecret('AIConnectionString');
        AI_CONNECTION_STRING = secret.value;

        // Initialize AI Projects Client
        aiProjectsClient = AIProjectsClient.fromConnectionString(
            AI_CONNECTION_STRING,
            new DefaultAzureCredential()
        );

        // Create code interpreter tool
        const codeInterpreterTool = ToolUtility.createCodeInterpreterTool();

        // Create agent
        agent = await aiProjectsClient.agents.createAgent("gpt-4o-mini", {
            name: "chat-agent",
            instructions: "You are a helpful AI assistant that provides clear and concise responses.",
            tools: [codeInterpreterTool.definition],
            toolResources: codeInterpreterTool.resources,
        });

        console.log('AI initialization completed successfully');
    } catch (error) {
        console.error('Error initializing AI:', error);
        throw error;
    }
}

// Initialize AI on startup
initializeAI().catch(console.error);

// Chat Route
app.post('/chat', async (req, res) => {
    try {
        const { userMessage } = req.body;
        
        if (!userMessage) {
            return res.status(400).json({ error: 'User message is required' });
        }

        if (!aiProjectsClient || !agent) {
            return res.status(503).json({ error: 'AI service not initialized' });
        }

        // Create a new thread for this conversation
        const thread = await aiProjectsClient.agents.createThread();

        // Add user message to thread
        await aiProjectsClient.agents.createMessage(thread.id, {
            role: "user",
            content: userMessage,
        });

        // Create response stream
        const streamEventMessages = await aiProjectsClient.agents.createRun(thread.id, agent.id).stream();
        
        let aiResponse = '';

        // Process stream events
        for await (const eventMessage of streamEventMessages) {
            switch (eventMessage.event) {
                case MessageStreamEvent.ThreadMessageDelta: {
                    const messageDelta = eventMessage.data;
                    messageDelta.delta.content.forEach((contentPart) => {
                        if (contentPart.type === "text") {
                            aiResponse += contentPart.text?.value || '';
                        }
                    });
                    break;
                }
                case ErrorEvent.Error:
                    console.error(`Stream error: ${eventMessage.data}`);
                    break;
                case DoneEvent.Done:
                    // Send the complete response
                    return res.json({ aiResponse });
            }
        }

    } catch (error) {
        console.error('Error in chat endpoint:', error);
        res.status(500).json({ error: 'Failed to process chat request' });
    }
});

// Cleanup endpoint (optional, for development)
app.post('/cleanup', async (req, res) => {
    try {
        if (agent && aiProjectsClient) {
            await aiProjectsClient.agents.deleteAgent(agent.id);
            console.log('Agent cleaned up successfully');
        }
        res.json({ message: 'Cleanup completed' });
    } catch (error) {
        console.error('Cleanup error:', error);
        res.status(500).json({ error: 'Cleanup failed' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Graceful shutdown
process.on('SIGTERM', async () => {
    try {
        if (agent && aiProjectsClient) {
            await aiProjectsClient.agents.deleteAgent(agent.id);
            console.log('Agent cleaned up during shutdown');
        }
    } catch (error) {
        console.error('Error during shutdown:', error);
    }
    process.exit(0);
});