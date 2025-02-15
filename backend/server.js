const express = require('express');
const cors = require('cors');
const { initializeAI } = require('./utils/initializeAI');
const chatRoutes = require('./routes/chatRoutes');
const fileRoutes = require('./routes/fileRoutes');
const documentRoutes = require('./routes/documentRoutes');
require('dotenv').config();
// The safe way to set up logging
const originalConsole = console;

const logger = {
    log: (...args) => originalConsole.log(new Date().toISOString(), '🔵', ...args),
    error: (...args) => originalConsole.error(new Date().toISOString(), '🔴', ...args),
    info: (...args) => originalConsole.info(new Date().toISOString(), '✨', ...args),
    warn: (...args) => originalConsole.warn(new Date().toISOString(), '⚠️', ...args)
};

// Now safe to assign
global.console = logger;
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Health check endpoint
app.get('/health', async (req, res) => {
    const { getAgents } = require('./utils/initializeAI');
    const agents = getAgents();
    
    if (agents && Object.values(agents).every(agent => agent !== null)) {
        res.status(200).json({ 
            status: 'healthy', 
            aiStatus: 'initialized',
            agents: Object.keys(agents)
        });
    } else {
        res.status(503).json({ 
            status: 'unhealthy', 
            aiStatus: 'not initialized' 
        });
    }
});

// Debug endpoint
app.get('/debug', (req, res) => {
    const { getClient, getAgents } = require('./utils/initializeAI');
    const client = getClient();
    const agents = getAgents();
    
    res.json({
        hasClient: !!client,
        agents: Object.keys(agents).reduce((acc, key) => {
            acc[key] = !!agents[key];
            return acc;
        }, {})
    });
});

// Initialize AI and start server
async function startServer() {
    try {
        // Initialize AI
        console.log('🚀 Starting AI initialization...');
        await initializeAI(app);
        console.log('✅ AI initialization complete');

        // Move routes inside AI initialization block
        app.use('/chat', chatRoutes);
        app.use('/upload', fileRoutes);
        app.use('/documents', documentRoutes); // Move here

        // Error handling middleware
        app.use((err, req, res, next) => {
            console.error('🔴 Error:', err);
            res.status(500).json({ error: 'Internal server error' });
        });

        // Start server
        app.listen(PORT, () => {
            console.log(`🟢 Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error('🔴 Failed to initialize AI:', error);
        process.exit(1);
    }
}

// Graceful shutdown handling
const shutdown = async (signal) => {
    console.log(`🔵 ${signal} received. Initiating shutdown...`);
    try {
        const { getClient, getAgents } = require('./utils/initializeAI');
        const client = getClient();
        const agents = getAgents();

        if (client && agents) {
            for (const [name, agent] of Object.entries(agents)) {
                if (agent) {
                    await client.agents.deleteAgent(agent.id);
                    console.log(`🗑️ ${name} cleaned up successfully`);
                }
            }
        }
    } catch (error) {
        console.error('❌ Error during AI cleanup:', error);
    }
    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start the application
startServer();
