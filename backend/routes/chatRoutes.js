const express = require('express');
const { processChat } = require('../agents/chatAgent');
const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { userMessage } = req.body;
        
        if (!userMessage) {
            return res.status(400).json({ error: 'User message is required' });
        }

        const aiResponse = await processChat(userMessage);
        res.json({ aiResponse });

    } catch (error) {
        console.error('Error in chat endpoint:', error);
        res.status(500).json({ error: 'Failed to process chat request' });
    }
});

module.exports = router;