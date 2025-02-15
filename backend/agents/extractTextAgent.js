const { MessageStreamEvent, DoneEvent, ErrorEvent } = require('@azure/ai-projects');

// Clean text before processing
function preprocessText(text) {
    return text
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .replace(/\[[\w\s-]+\]/g, '')                  // Remove DOCX field codes
    .replace(/\s*\n{3,}\s*/g, '\n\n')             // Normalize multiple newlines
    .replace(/[•●■]/g, '-')                        // Replace bullets with dashes
    .replace(/\s+/g, ' ')                          // Normalize spaces
    .replace(/[\u2028\u2029\u0085]/g, ' ')        // Remove special characters
    .trim();
}

async function extractText(textContent, aiAgents) {
    const { aiProjectsClient, extractAgent } = aiAgents;
    if (!aiProjectsClient || !extractAgent) {
        throw new Error('Extract agent not initialized');
    }

    try {
        // Preprocess the text first
        const cleanedText = preprocessText(textContent);
        console.log('Creating thread for text processing...');
        console.log(`Input text length: ${cleanedText.length} characters`);
        
        const thread = await aiProjectsClient.agents.createThread();
        
        console.log('Creating message with text content...');
        await aiProjectsClient.agents.createMessage(thread.id, {
            role: "user",
            content: `Please process and clean this text content, ensuring proper formatting and structure:

${cleanedText}

Please maintain:
1. Paragraph structure
2. Section organization
3. Key information
4. Logical flow of content`,
        });

        console.log('Starting stream processing...');
        const streamEventMessages = await aiProjectsClient.agents.createRun(thread.id, extractAgent.id).stream();
        let processedText = '';
        let hasError = false;
        let errorMessage = '';

        for await (const eventMessage of streamEventMessages) {
            console.log('Received event:', eventMessage.event);
            
            switch (eventMessage.event) {
                case MessageStreamEvent.ThreadMessageDelta: {
                    const messageDelta = eventMessage.data;
                    messageDelta.delta.content.forEach((contentPart) => {
                        if (contentPart.type === "text") {
                            processedText += contentPart.text?.value || '';
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
                    console.error('Stream error:', eventMessage.data);
                    hasError = true;
                    errorMessage = eventMessage.data || 'Stream error occurred';
                    break;
                case DoneEvent.Done:
                    console.log('Stream processing completed');
                    break;
            }
        }

        processedText = processedText.trim();
        if (!processedText || hasError) {
            console.warn('Processing failed, falling back to preprocessed text...');
            processedText = cleanedText;
        }

        if (!processedText) {
            throw new Error('No text was processed from the content');
        }

        console.log(`Text processing successful, final length: ${processedText.length} characters`);
        // Log a sample of the processed text for debugging
        console.log('Sample of processed text:', processedText.substring(0, 200) + '...');
        
        return processedText;
    } catch (error) {
        console.error('Error in extractText:', error);
        // Try to return preprocessed text as fallback
        const fallbackText = preprocessText(textContent);
        if (fallbackText) {
            console.log('Returning preprocessed text as fallback');
            return fallbackText;
        }
        throw new Error(`Failed to process text: ${error.message}`);
    }
}

module.exports = { extractText };