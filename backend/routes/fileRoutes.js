const express = require('express');
const multer = require('multer');
const mammoth = require('mammoth');
const { BlobServiceClient } = require('@azure/storage-blob');
const { CosmosClient } = require('@azure/cosmos');
const pdfParse = require('pdf-parse');
const { processDocument } = require('../agents/documentProcessing');
require('dotenv').config();

const router = express.Router();

// Configure multer
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/plain' || 
            file.mimetype === 'application/pdf' ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            cb(null, true);
        } else {
            cb(new Error('Only .txt, .pdf, and .docx files are currently supported'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Configure Azure services
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.BLOB_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient('uploads');

const cosmosClient = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING);
const database = cosmosClient.database('DocumentsDB');
const container = database.container('Files');

// Store document in Blob Storage
async function storeInBlob(file, fileName) {
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    await blockBlobClient.uploadData(file.buffer);
    return blockBlobClient.url;
}

// Store metadata in CosmosDB
async function storeInCosmos(documentData) {
    const { resource: createdItem } = await container.items.create(documentData);
    return createdItem;
}

// Extract text from file
async function extractFileContent(file) {
    try {
        let extractedText = '';
        
        if (file.mimetype === 'application/pdf') {
            console.log('🔄 Processing PDF file...');
            const pdfData = await pdfParse(file.buffer);
            extractedText = pdfData.text;
            console.log('📄 Raw text length:', extractedText.length);
        } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            console.log('🔄 Processing DOCX file...');
            const result = await mammoth.extractRawText({ buffer: file.buffer });
            extractedText = result.value;
            console.log('📄 Raw text length:', extractedText.length);
        } else {
            console.log('🔄 Processing text file...');
            extractedText = file.buffer.toString('utf-8');
        }

        if (!extractedText.trim()) {
            throw new Error('No text content could be extracted');
        }

        console.log(`✅ Content extracted, length: ${extractedText.length}`);
        return extractedText;
    } catch (error) {
        console.error('❌ Error extracting content:', error);
        throw error;
    }
}

// File upload and processing route
router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('📁 Processing file:', {
            filename: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        });

        // Step 1: Store original file in Blob Storage
        const fileName = `${Date.now()}-${req.file.originalname}`;
        const fileUrl = await storeInBlob(req.file, fileName);
        console.log('✅ File stored in Blob Storage:', fileUrl);

        // Step 2: Extract text content
        const textContent = await extractFileContent(req.file);

        // Step 3: Process with AI agents
        console.log('🤖 Processing with AI agents...');
        const { processedText, summary, title } = await processDocument(textContent);

        // Step 4: Store in CosmosDB
        const documentData = {
            id: `doc_${Date.now()}`,
            fileUrl,
            title,
            summary,
            processedText,
            originalFileName: req.file.originalname,
            fileType: req.file.mimetype,
            timestamp: new Date().toISOString(),
            processed: true
        };

        const storedDocument = await storeInCosmos(documentData);
        console.log('✅ Document metadata stored in CosmosDB');

        res.json({
            message: 'File processed successfully',
            documentId: storedDocument.id,
            title,
            summary,
            fileUrl
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ 
            error: 'Failed to process file',
            details: error.message 
        });
    }
});

module.exports = router;