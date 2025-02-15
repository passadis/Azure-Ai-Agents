const { MessageStreamEvent, DoneEvent, ErrorEvent } = require('@azure/ai-projects');
const { getClient, getAgents } = require('../utils/initializeAI');

async function processChat(userMessage) {
    const aiProjectsClient = getClient();
    const { chatAgent } = getAgents();

    if (!aiProjectsClient || !chatAgent) {
        throw new Error('Chat services not initialized');
    }

    try {
        const thread = await aiProjectsClient.agents.createThread();
        await aiProjectsClient.agents.createMessage(thread.id, {
            role: "user",
            content: userMessage,
        });

        const streamEventMessages = await aiProjectsClient.agents.createRun(thread.id, chatAgent.id).stream();
        let aiResponse = '';

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
                    return aiResponse.trim();
            }
        }

        return aiResponse.trim();
    } catch (error) {
        console.error('Error in chat processing:', error);
        throw error;
    }
}

module.exports = { processChat };