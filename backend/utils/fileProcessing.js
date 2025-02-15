const { AIProjectsClient } = require('@azure/ai-projects');
const { DefaultAzureCredential } = require('@azure/identity');

const aiProjectsClient = AIProjectsClient.fromConnectionString(process.env.AI_CONNECTION_STRING, new DefaultAzureCredential());

async function processFileWithAI(fileUrl) {
    try {
        // Create AI agent for summarization
        const summarizationAgent = await aiProjectsClient.agents.createAgent("gpt-4o-mini", {
            name: "Summarizer",
            instructions: "Summarize the uploaded document concisely.",
        });

        // Create AI agent for title generation
        const titleAgent = await aiProjectsClient.agents.createAgent("gpt-4o-mini", {
            name: "TitleGenerator",
            instructions: "Generate a relevant title for the uploaded document based on its contents.",
        });

        // Create a thread and add file content for summarization
        const thread = await aiProjectsClient.agents.createThread();
        await aiProjectsClient.agents.createMessage(thread.id, {
            role: "user",
            content: `Summarize this document: ${fileUrl}`,
        });

        // Get summary
        const summaryStream = await aiProjectsClient.agents.createRun(thread.id, summarizationAgent.id).stream();
        let summary = "";
        for await (const event of summaryStream) {
            if (event.event === "thread.message.delta") {
                summary += event.data.delta.content.find(c => c.type === "text")?.text.value || "";
            }
        }

        // Get title
        const titleStream = await aiProjectsClient.agents.createRun(thread.id, titleAgent.id).stream();
        let title = "";
        for await (const event of titleStream) {
            if (event.event === "thread.message.delta") {
                title += event.data.delta.content.find(c => c.type === "text")?.text.value || "";
            }
        }

        return { summary, title };
    } catch (error) {
        console.error("AI Processing Error:", error);
        return { summary: "Failed to summarize.", title: "No title generated." };
    }
}

module.exports = { processFileWithAI };
