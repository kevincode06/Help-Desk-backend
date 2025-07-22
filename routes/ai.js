// routes/aiRouter.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { generateAIResponse, getSuggestions } = require('../services/aiService');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Chat endpoint
router.post('/chat', protect, async (req, res) => {
    try {
        const { message, conversationHistory = [] } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ success: false, error: 'Message is required' });
        }

        if (message.length > 1000) {
            return res.status(400).json({ success: false, error: 'Message is too long. Please keep it under 1000 characters.' });
        }

        const aiResponse = await generateAIResponse(message, conversationHistory);

        console.log('AI Chat Interaction:', {
            userId: req.user.id,
            message: message.substring(0, 100),
            responseLength: aiResponse.length,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            data: {
                response: aiResponse,
                timestamp: new Date().toISOString(),
                messageId: Date.now().toString()
            }
        });
    } catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({ success: false, error: 'Failed to generate AI response. Please try again.' });
    }
});

// Suggestions endpoint
router.get('/suggestions', protect, async (req, res) => {
    try {
        const suggestions = await getSuggestions();

        // Shuffle suggestions randomly and return first 6
        const shuffled = suggestions.sort(() => 0.5 - Math.random());

        res.json({
            success: true,
            data: { suggestions: shuffled.slice(0, 6) }
        });
    } catch (error) {
        console.error('AI Suggestions Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch suggestions' });
    }
});

// Feedback endpoint
router.post('/feedback', protect, async (req, res) => {
    try {
        const { messageId, rating, feedback } = req.body;

        if (!messageId || !rating) {
            return res.status(400).json({ success: false, error: 'Message ID and rating are required' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
        }

        const feedbackData = {
            userId: req.user.id,
            messageId,
            rating,
            feedback: feedback || null,
            timestamp: new Date().toISOString()
        };

        console.log('AI Feedback Received:', feedbackData);

        // TODO: Save feedbackData to your database here

        res.json({
            success: true,
            message: 'Thank you for your feedback! This helps us improve our AI assistant.'
        });
    } catch (error) {
        console.error('AI Feedback Error:', error);
        res.status(500).json({ success: false, error: 'Failed to submit feedback' });
    }
});

// Chat history endpoint (stub)
router.get('/history', protect, async (req, res) => {
    try {
        // TODO: Fetch chat history from DB

        res.json({
            success: true,
            data: { history: [], message: 'Chat history feature coming soon!' }
        });
    } catch (error) {
        console.error('AI History Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch chat history' });
    }
});

// Service status endpoint
router.get('/status', protect, async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(['Hello']);
        const response = await result.response;

        res.json({
            success: true,
            data: {
                status: 'operational',
                model: 'gemini-1.5-flash',
                lastChecked: new Date().toISOString(),
                message: 'AI service is working properly'
            }
        });
    } catch (error) {
        console.error('AI Status Check Error:', error);
        res.json({
            success: true,
            data: {
                status: 'degraded',
                model: 'fallback',
                lastChecked: new Date().toISOString(),
                message: 'AI service is using fallback responses'
            }
        });
    }
});

module.exports = router;
