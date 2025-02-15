const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
const { AIProjectsClient, ToolUtility } = require('@azure/ai-projects');
require('dotenv').config();

// Keep track of global instances
let aiProjectsClient = null;
let agents = {
    chatAgent: null,
    extractAgent: null,
    summarizeAgent: null,
    titleAgent: null
};

async function initializeAI(app) {
    try {
        // Setup Azure Key Vault
        const keyVaultName = process.env.KEYVAULT_NAME;
        const keyVaultUrl = `https://${keyVaultName}.vault.azure.net`;
        const credential = new DefaultAzureCredential();
        const secretClient = new SecretClient(keyVaultUrl, credential);

        // Get AI connection string
        const secret = await secretClient.getSecret('AIConnectionString');
        const AI_CONNECTION_STRING = secret.value;

        // Initialize AI Projects Client
        aiProjectsClient = AIProjectsClient.fromConnectionString(
            AI_CONNECTION_STRING,
            credential
        );

        // Create code interpreter tool (shared among agents)
        const codeInterpreterTool = ToolUtility.createCodeInterpreterTool();
        const tools = [codeInterpreterTool.definition];
        const toolResources = codeInterpreterTool.resources;

        console.log('🚀 Creating AI Agents...');

        // Create chat agent
        agents.chatAgent = await aiProjectsClient.agents.createAgent("gpt-4o-mini", {
            name: "chat-agent",
            instructions: "You are a helpful AI assistant that provides clear and concise responses.",
            tools,
            toolResources
        });
        console.log('✅ Chat Agent created');

        // Create extraction agent
        agents.extractAgent = await aiProjectsClient.agents.createAgent("gpt-4o-mini", {
            name: "extract-agent",
            instructions: "Process and clean text content while maintaining structure and important information.",
            tools,
            toolResources
        });
        console.log('✅ Extract Agent created');

        // Create summarization agent
        agents.summarizeAgent = await aiProjectsClient.agents.createAgent("gpt-4o-mini", {
            name: "summarize-agent",
            instructions: "Create concise summaries that capture main points and key details.",
            tools,
            toolResources
        });
        console.log('✅ Summarize Agent created');

        // Create title agent
        agents.titleAgent = await aiProjectsClient.agents.createAgent("gpt-4o-mini", {
            name: "title-agent",
            instructions: `You are a specialized title generation assistant.
            Your task is to create titles for documents following these rules:
            1. Generate ONLY the title text, no additional explanations
            2. Maximum length of 50 characters
            3. Focus on the main topic or theme
            4. Use proper capitalization (Title Case)
            5. Avoid special characters and quotes
            6. Make titles clear and descriptive
            7. Respond with nothing but the title itself
        
            Example good responses:
            Digital Transformation Strategy 2025
            Market Analysis: Premium Chai Tea
            Cloud Computing Implementation Guide
        
            Example bad responses:
            "Here's a title for your document: Digital Strategy" (no explanations needed)
            This document appears to be about digital transformation (just the title needed)
            The title is: Market Analysis (no extra text)`,
            tools,
            toolResources
        });
        console.log('✅ Title Agent created');

        // Store in app.locals
        app.locals.aiProjectsClient = aiProjectsClient;
        app.locals.agents = agents;

        console.log('✅ All AI Agents initialized successfully');
        return { aiProjectsClient, agents };
    } catch (error) {
        console.error('❌ Error initializing AI:', error);
        throw error;
    }
}

// Export both the initialization function and the shared instances
module.exports = { 
    initializeAI,
    getClient: () => aiProjectsClient,
    getAgents: () => agents
};