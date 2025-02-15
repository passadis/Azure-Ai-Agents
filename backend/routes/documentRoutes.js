const express = require('express');
const { CosmosClient } = require('@azure/cosmos');
require('dotenv').config();

const router = express.Router();

// Configure CosmosDB
const COSMOS_DB_CONNECTION_STRING = process.env.COSMOS_DB_CONNECTION_STRING;
const cosmosClient = new CosmosClient(COSMOS_DB_CONNECTION_STRING);
const database = cosmosClient.database('DocumentsDB');
const container = database.container('Files');

// Fetch stored documents
router.get('/', async (req, res) => {
    console.log('📄 Received request for documents...');
    try {
        const querySpec = {
            query: "SELECT * FROM c ORDER BY c.timestamp DESC"
        };

        const { resources: documents } = await container.items.query(querySpec).fetchAll();
        console.log(`📄 Returning ${documents.length} documents.`);
        
        res.json(documents);
    } catch (error) {
        console.error('❌ Error fetching documents:', error);
        res.status(500).json({ error: 'Failed to retrieve documents' });
    }
});


module.exports = router;
