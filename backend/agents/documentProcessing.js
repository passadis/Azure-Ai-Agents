const { MessageStreamEvent, DoneEvent, ErrorEvent } = require('@azure/ai-projects');
const { getClient, getAgents } = require('../utils/initializeAI');

async function processWithAgent(agent, content, prompt, agentName) {
    const aiProjectsClient = getClient();
    
    if (!aiProjectsClient || !agent) {
        throw new Error(`${agentName} not initialized`);
    }

    try {
        console.log(`\n🎯 ${agentName} PROCESSING START 🎯`);
        console.log('==========================================');
        
        const thread = await aiProjectsClient.agents.createThread();
        console.log(`📋 ${agentName} Thread ID: ${thread.id}`);

        await aiProjectsClient.agents.createMessage(thread.id, {
            role: "user",
            content: `${prompt}\n\n${content}`,
        });
        console.log(`📤 ${agentName} Message sent to agent`);

        const streamEventMessages = await aiProjectsClient.agents.createRun(thread.id, agent.id).stream();
        let result = '';

        console.log(`\n🔄 ${agentName} STREAM PROCESSING`);
        for await (const eventMessage of streamEventMessages) {
            console.log(`📍 ${agentName} Event:`, eventMessage.event);
            
            switch (eventMessage.event) {
                case MessageStreamEvent.ThreadMessageDelta: {
                    const messageDelta = eventMessage.data;
                    console.log(`📦 ${agentName} Delta:`, JSON.stringify(messageDelta));
                    
                    messageDelta.delta.content.forEach((contentPart) => {
                        if (contentPart.type === "text") {
                            const newText = contentPart.text?.value || '';
                            console.log(`📝 ${agentName} New Text:`, newText);
                            result += newText;
                        }
                    });
                    break;
                }
                case ErrorEvent.Error:
                    console.error(`❌ ${agentName} Stream Error:`, eventMessage.data);
                    break;
                case DoneEvent.Done:
                    console.log(`✅ ${agentName} Processing Complete`);
                    console.log(`📄 ${agentName} Result Length: ${result.length}`);
                    break;
            }
        }

        console.log('==========================================\n');
        return result.trim();
    } catch (error) {
        console.error(`❌ ${agentName} Error:`, error);
        throw error;
    }
}

async function processDocument(textContent) {
    const { extractAgent, summarizeAgent, titleAgent } = getAgents();
    
    try {
        console.log('\n🚀 DOCUMENT PROCESSING START');
        console.log('==========================================');
        
        // Step 1: Process text with extraction agent
        const processedText = await processWithAgent(
            extractAgent,
            textContent,
            "Process and clean the provided text while maintaining structure and important information:",
            "EXTRACT"
        );
        console.log('✅ Text Extraction Complete');

        // Step 2: Generate summary
        const summary = await processWithAgent(
            summarizeAgent,
            processedText,
            "Create a clear and concise summary of this text, capturing the main points:",
            "SUMMARY"
        );
        console.log('✅ Summary Generation Complete');

        // Step 3: Generate title
        const title = await processWithAgent(
            titleAgent,
            summary,
            "Generate a clear, descriptive title (maximum 50 characters) for this content:",
            "TITLE"
        );
        console.log('✅ Title Generation Complete');

        console.log('\n📊 FINAL RESULTS:');
        console.log('Processed Text Length:', processedText.length);
        console.log('Summary Length:', summary.length);
        console.log('Title:', title);
        console.log('==========================================\n');

        return { processedText, summary, title };
    } catch (error) {
        console.error('❌ DOCUMENT PROCESSING ERROR:', error);
        // Provide basic fallbacks if processing fails
        return {
            processedText: textContent.trim(),
            summary: textContent.split('.')[0] + '.',
            title: 'Untitled Document'
        };
    }
}

module.exports = { processDocument };