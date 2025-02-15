const { MessageStreamEvent, DoneEvent, ErrorEvent } = require('@azure/ai-projects');

function createBasicSummary(text, maxLength = 1000) {
    // Simple fallback summary generator
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const firstFewSentences = sentences.slice(0, 3).join('. ').trim();
    return firstFewSentences.length > maxLength 
        ? firstFewSentences.substring(0, maxLength) + '...'
        : firstFewSentences + '.';
}

async function summarizeText(extractedText, aiAgents) {
    const { aiProjectsClient, summarizeAgent } = aiAgents;
    if (!aiProjectsClient || !summarizeAgent) {
        throw new Error('Summarize agent not initialized');
    }

    // Validate input
    if (!extractedText || typeof extractedText !== 'string') {
        throw new Error('Invalid input: text is required');
    }

    const trimmedText = extractedText.trim();
    if (trimmedText.length === 0) {
        throw new Error('Empty text provided');
    }

    try {
        console.log('Creating thread for summarization...');
        const thread = await aiProjectsClient.agents.createThread();
        
        console.log(`Creating message with text to summarize (length: ${trimmedText.length} chars)...`);
        await aiProjectsClient.agents.createMessage(thread.id, {
            role: "user",
            content: `Please provide a clear and concise summary of this text, maintaining key points and important details:\n\n${trimmedText}`,
        });

        console.log('Starting stream processing for summarization...');
        const streamEventMessages = await aiProjectsClient.agents.createRun(thread.id, summarizeAgent.id).stream();
        let summary = '';
        let hasError = false;
        let errorMessage = '';

        for await (const eventMessage of streamEventMessages) {
            console.log('Received event:', eventMessage.event);
            
            switch (eventMessage.event) {
                case MessageStreamEvent.ThreadMessageDelta: {
                    const messageDelta = eventMessage.data;
                    messageDelta.delta.content.forEach((contentPart) => {
                        if (contentPart.type === "text") {
                            summary += contentPart.text?.value || '';
                        }
                    });
                    break;
                }
                case 'thread.run.failed':
                    hasError = true;
                    errorMessage = eventMessage.data?.error?.message || 'Unknown error occurred';
                    console.error('Run failed:', errorMessage);
                    break;
                case ErrorEvent.Error:
                    hasError = true;
                    errorMessage = eventMessage.data || 'Stream error occurred';
                    console.error('Stream error:', errorMessage);
                    break;
                case DoneEvent.Done:
                    console.log('Summarization completed');
                    break;
            }
        }

        // Check if we have a valid summary
        summary = summary.trim();
        if (!summary || hasError) {
            console.warn('AI summarization failed, falling back to basic summary...');
            summary = createBasicSummary(trimmedText);
            console.log('Created fallback summary:', summary);
        }

        if (!summary) {
            throw new Error('Failed to generate summary even with fallback method');
        }

        console.log(`Summarization successful, length: ${summary.length} chars`);
        return summary;
    } catch (error) {
        console.error('Error in summarizeText:', error);
        // Try fallback one last time
        try {
            const fallbackSummary = createBasicSummary(trimmedText);
            console.log('Using emergency fallback summary');
            return fallbackSummary;
        } catch (fallbackError) {
            throw new Error(`Failed to summarize text: ${error.message}`);
        }
    }
}

module.exports = { summarizeText };