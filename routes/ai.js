
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const genAI = require('../config/gemini');

// Simple AI response handler (you can replace with actual AI service)
const generateAIResponse = async (message, conversationHistory) => {
    // This is a simple rule-based response system
    // Replace with actual AI service like OpenAI, Anthropic, etc.
    
    const lowercaseMessage = message.toLowerCase();
    
    // Common support responses
    if (lowercaseMessage.includes('password') || lowercaseMessage.includes('login')) {
        return "To reset your password, go to the login page and click 'Forgot Password'. You'll receive an email with reset instructions. If you don't receive the email, check your spam folder or contact support.";
    }
    
    if (lowercaseMessage.includes('account') || lowercaseMessage.includes('profile')) {
        return "You can update your account information by going to your profile settings. From there, you can change your name, email, and other personal details. Remember to save your changes!";
    }
    
    if (lowercaseMessage.includes('support') || lowercaseMessage.includes('contact')) {
        return "You can contact our support team by creating a ticket through this dashboard. Our team typically responds within 24 hours during business days (Monday-Friday, 9 AM - 6 PM EST).";
    }
    
    if (lowercaseMessage.includes('hours') || lowercaseMessage.includes('business')) {
        return "Our support hours are Monday through Friday, 9:00 AM to 6:00 PM EST. For urgent issues outside these hours, please create a high-priority ticket and we'll respond as soon as possible.";
    }
    
    if (lowercaseMessage.includes('billing') || lowercaseMessage.includes('payment')) {
        return "For billing inquiries, please create a support ticket with 'Billing' in the title. Include your account details and specific questions. Our billing team will respond within 1 business day.";
    }
    
    if (lowercaseMessage.includes('bug') || lowercaseMessage.includes('error')) {
        return "If you're experiencing a bug or error, please create a support ticket with detailed information including: steps to reproduce the issue, browser/device information, and any error messages. Screenshots are also helpful!";
    }
    
    if (lowercaseMessage.includes('feature') || lowercaseMessage.includes('request')) {
        return "We love hearing feature requests! Please create a support ticket with 'Feature Request' in the title and describe what you'd like to see. Our product team reviews all suggestions.";
    }
    
    if (lowercaseMessage.includes('cancel') || lowercaseMessage.includes('subscription')) {
        return "To manage your subscription, go to your account settings and click on 'Billing & Subscription'. From there you can upgrade, downgrade, or cancel your plan. Changes take effect at the next billing cycle.";
    }
    
    if (lowercaseMessage.includes('how') || lowercaseMessage.includes('tutorial')) {
        return "For tutorials and guides, check out our Help Center in the main menu. You can also find video tutorials and step-by-step guides for common tasks. If you need specific help, feel free to ask!";
    }
    
    if (lowercaseMessage.includes('hello') || lowercaseMessage.includes('hi') || lowercaseMessage.includes('hey')) {
        return "Hello! I'm here to help you with any questions or issues you might have. What can I assist you with today?";
    }
    
    if (lowercaseMessage.includes('thank') || lowercaseMessage.includes('thanks')) {
        return "You're welcome! Is there anything else I can help you with today?";
    }
    
    // Default response for unmatched messages
    return "I understand you're looking for help. For the best assistance, please create a support ticket with details about your specific question or issue. Our support team will provide you with detailed guidance. You can also try rephrasing your question if you're looking for quick help!";
};

// POST /api/ai/chat - Handle AI chat messages
router.post('/chat', protect, async (req, res) => {
    try {
        const { message, conversationHistory = [] } = req.body;
        
        // Validate input
        if (!message || message.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }
        
        // Generate AI response
        const aiResponse = await generateAIResponse(message, conversationHistory);
        
        // Return response
        res.json({
            success: true,
            data: {
                response: aiResponse,
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate AI response'
        });
    }
});

// GET /api/ai/suggestions - Get conversation starters or suggestions
router.get('/suggestions', protect, async (req, res) => {
    try {
        const suggestions = [
            "How do I reset my password?",
            "How can I contact support?",
            "What are your business hours?",
            "How do I update my profile?",
            "I'm experiencing a bug",
            "How do I cancel my subscription?",
            "I need help with billing"
        ];
        
        res.json({
            success: true,
            data: {
                suggestions
            }
        });
        
    } catch (error) {
        console.error('AI Suggestions Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch suggestions'
        });
    }
});

// POST /api/ai/feedback - Handle feedback on AI responses
router.post('/feedback', protect, async (req, res) => {
    try {
        const { messageId, rating, feedback } = req.body;
        
        // Validate input
        if (!messageId || !rating) {
            return res.status(400).json({
                success: false,
                error: 'Message ID and rating are required'
            });
        }
        
        // Here you would typically save feedback to database
        // For now, just log it
        console.log('AI Feedback:', {
            userId: req.user.id,
            messageId,
            rating,
            feedback,
            timestamp: new Date().toISOString()
        });
        
        res.json({
            success: true,
            message: 'Feedback received successfully'
        });
        
    } catch (error) {
        console.error('AI Feedback Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit feedback'
        });
    }
});

module.exports = router;