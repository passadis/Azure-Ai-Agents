const { MessageStreamEvent, DoneEvent, ErrorEvent } = require('@azure/ai-projects');

function preprocessContent(content) {
    if (!content) return '';
    
    return content
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .replace(/\s+/g, ' ')                          // Normalize whitespace
        .split('\n')                                   // Split into lines
        .filter(line => line.trim())                   // Remove empty lines
        .slice(0, 5)                                   // Take first 5 non-empty lines
        .join('\n')                                    // Join back together
        .trim();                                       // Final trim
}

function cleanTitle(title) {
    if (!title) return null;
    
    return title
        .replace(/^(title:|the title is:|here'?s?( a)? title:?)/gi, '')
        .replace(/["']/g, '')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

async function generateTitle(content, aiAgents) {
    const { aiProjectsClient, titleAgent } = aiAgents;
    if (!aiProjectsClient || !titleAgent) {
        throw new Error('Title agent not initialized');
    }

    try {
        console.log('🎯🎯🎯 TITLE AGENT: STARTED GENERATION 🎯🎯🎯');
        const thread = await aiProjectsClient.agents.createThread();
        console.log('📋 Thread ID:', thread.id);

        const processedContent = preprocessContent(content);
        console.log('📄 CONTENT START >>>', processedContent.substring(0, 100) + '...');

        const prompt = `Your task is to generate a professional title.

Instructions:
1. Read the first few paragraphs of the content
2. Create a clear, descriptive title (maximum 50 characters)
3. Focus on the main topic or purpose
4. Use professional business language
5. Respond with ONLY the title text

For example, if content is about market analysis, respond like this:
Market Analysis: Premium Tea Launch

Content to analyze:
${processedContent}`;


await aiProjectsClient.agents.createMessage(thread.id, { role: "user", content: prompt });
console.log('📨 Prompt sent to agent');

console.log('⚡️⚡️⚡️ STARTING STREAM PROCESSING ⚡️⚡️⚡️');
const streamEventMessages = await aiProjectsClient.agents.createRun(thread.id, titleAgent.id).stream();
let title = '';
let hasError = false;
let errorMessage = '';

for await (const eventMessage of streamEventMessages) {
    switch (eventMessage.event) {
        case MessageStreamEvent.ThreadMessageDelta: {
            const messageDelta = eventMessage.data;
            console.log('🔵 DELTA >>>', JSON.stringify(messageDelta));
            
            if (messageDelta.delta.content) {
                messageDelta.delta.content.forEach((contentPart) => {
                    if (contentPart.type === "text") {
                        const newText = contentPart.text?.value || '';
                        console.log('📌 NEW TEXT >>>', newText);
                        title += newText;
                    }
                });
            }
            break;
        }
        case 'thread.run.failed':
            hasError = true;
            errorMessage = eventMessage.data?.error?.message || 'Unknown error occurred';
            console.log('❌❌❌ RUN FAILED:', errorMessage);
            break;
        case ErrorEvent.Error:
            hasError = true;
            errorMessage = eventMessage.data || 'Stream error occurred';
            console.log('⛔️⛔️⛔️ STREAM ERROR:', errorMessage);
            break;
        case DoneEvent.Done:
            console.log('✅✅✅ STREAM COMPLETED ✅✅✅');
            console.log('📝 CURRENT TITLE:', title);
            break;
    }
}

let finalTitle = cleanTitle(title);
console.log('🎯 FINAL RESULTS:');
console.log('   Raw Title:', title);
console.log('   Cleaned Title:', finalTitle);

if (!finalTitle || hasError) {
    console.log('⚠️⚠️⚠️ USING FALLBACK TITLE ⚠️⚠️⚠️');
    finalTitle = createFallbackTitle(content);
    console.log('   Fallback Title:', finalTitle);
}

console.log('🏁🏁🏁 TITLE GENERATION COMPLETE 🏁🏁🏁');
return finalTitle;

} catch (error) {
console.log('💥💥💥 ERROR IN TITLE GENERATION:', error.message);
const fallbackTitle = content.split('\n')[0].substring(0, 50).trim() || "Untitled Document";
console.log('🔄 Emergency Fallback Title:', fallbackTitle);
return fallbackTitle;
}
}

module.exports = { generateTitle };