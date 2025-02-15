// agents/storageAgent.js - Stores Document Metadata in Blob Storage & CosmosDB
const { CosmosClient } = require('@azure/cosmos');
require('dotenv').config();

// Configure CosmosDB
const COSMOS_DB_CONNECTION_STRING = process.env.COSMOS_DB_CONNECTION_STRING;
const cosmosClient = new CosmosClient(COSMOS_DB_CONNECTION_STRING);
const database = cosmosClient.database('DocumentsDB');
const container = database.container('Files');

// Store document metadata in CosmosDB
async function storeDocument(fileUrl, title, summary) {
    try {
        const documentMetadata = {
            id: `${Date.now()}`,
            title,
            summary,
            storagePath: fileUrl,
            timestamp: new Date().toISOString()
        };
        await container.items.create(documentMetadata);
        console.log('Document metadata stored successfully');
    } catch (error) {
        console.error('Error storing document metadata:', error);
        throw new Error('Failed to store document metadata.');
    }
}

module.exports = { storeDocument };
