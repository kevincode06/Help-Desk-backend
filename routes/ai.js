const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Enhanced AI response handler with Gemini integration
const generateAIResponse = async (message, conversationHistory = []) => {
    try {
        // Use Gemini AI for intelligent responses
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Create system prompt for help desk context
        const systemPrompt = `You are a professional help desk AI assistant. Your role is to:
1. Provide helpful, accurate information about common support issues
2. Guide users to appropriate resources
3. Maintain a friendly, professional tone
4. Suggest creating support tickets for complex issues
5. Provide step-by-step solutions when possible

Common support topics include:
- Password resets and login issues
- Account management and profile updates
- Billing and subscription questions
- Technical troubleshooting
- Feature requests and bug reports
- General help and tutorials

Keep responses concise but comprehensive. If you can't solve an issue directly, guide users to create a support ticket.

User message: ${message}
`;

        // Map conversation history to Gemini format
        const historyParts = conversationHistory.map(msg => ({
            role: msg.sender === 'ai' ? 'model' : 'user',
            parts: [{ text: msg.message }]
        }));

        const chat = model.startChat({ 
            history: historyParts,
            generationConfig: {
                maxOutputTokens: 400,
                temperature: 0.7,
            }
        });

        const result = await chat.sendMessage(systemPrompt);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error('Gemini AI Error:', error);
        
        // Fallback to rule-based responses if Gemini fails
        return generateRuleBasedResponse(message);
    }
};

// Fallback rule-based response system
const generateRuleBasedResponse = (message) => {
    const lowercaseMessage = message.toLowerCase();
    
    // Password and login issues
    if (lowercaseMessage.includes('password') || lowercaseMessage.includes('login') || lowercaseMessage.includes('sign in')) {
        return " **Password Reset Help**\n\nTo reset your password:\n1. Go to the login page\n2. Click 'Forgot Password'\n3. Enter your email address\n4. Check your email for reset instructions\n5. Check spam folder if you don't see the email\n\nIf you're still having trouble, please create a support ticket and we'll help you directly!";
    }
    
    // Account and profile management
    if (lowercaseMessage.includes('account') || lowercaseMessage.includes('profile') || lowercaseMessage.includes('update')) {
        return " **Account Management**\n\nTo update your account information:\n1. Go to your Profile Settings\n2. Update your name, email, or other details\n3. Click 'Save Changes'\n\nFor security changes or account issues, please create a support ticket with 'Account' in the title.";
    }
    
    // Support and contact information
    if (lowercaseMessage.includes('support') || lowercaseMessage.includes('contact') || lowercaseMessage.includes('help')) {
        return " **Contact Support**\n\nYou can reach our support team by:\n- Creating a ticket through this dashboard\n- Our team responds within 24 hours during business days\n- For urgent issues, mark your ticket as 'High Priority'\n\nBusiness Hours: Monday-Friday, 9 AM - 6 PM EST";
    }
    
    // Business hours
    if (lowercaseMessage.includes('hours') || lowercaseMessage.includes('business') || lowercaseMessage.includes('when')) {
        return " **Support Hours**\n\nOur support team is available:\n- Monday through Friday\n- 9:00 AM to 6:00 PM EST\n\nFor urgent issues outside these hours, create a high-priority ticket and we'll respond as soon as possible!";
    }
    
    // Billing and payment
    if (lowercaseMessage.includes('billing') || lowercaseMessage.includes('payment') || lowercaseMessage.includes('invoice')) {
        return "Billing Support\n\nFor billing inquiries:\n1. Create a support ticket with 'Billing' in the title\n2. Include your account details\n3. Describe your specific question\n\nOur billing team responds within 1 business day. You can also check your billing history in Account Settings.";
    }
    
    // Bug reports and errors
    if (lowercaseMessage.includes('bug') || lowercaseMessage.includes('error') || lowercaseMessage.includes('broken') || lowercaseMessage.includes('not working')) {
        return "Bug Report\n\nTo report a bug or error:\n1. Create a support ticket with 'Bug Report' in the title\n2. Include:\n   - Steps to reproduce the issue\n   - Browser/device information\n   - Error messages or screenshots\n   - What you expected to happen\n\nThis helps our team fix the issue quickly!";
    }
    
    // Feature requests
    if (lowercaseMessage.includes('feature') || lowercaseMessage.includes('request') || lowercaseMessage.includes('suggestion')) {
        return "Feature Request\n\nWe love hearing your ideas!\n1. Create a support ticket with 'Feature Request' in the title\n2. Describe what you'd like to see\n3. Explain how it would help you\n\nOur product team reviews all suggestions and considers them for future updates.";
    }
    
    // Subscription management
    if (lowercaseMessage.includes('cancel') || lowercaseMessage.includes('subscription') || lowercaseMessage.includes('plan')) {
        return "Subscription Management\n\nTo manage your subscription:\n1. Go to Account Settings\n2. Click 'Billing & Subscription'\n3. Choose upgrade, downgrade, or cancel\n\nChanges take effect at your next billing cycle. Need help? Create a ticket with 'Subscription' in the title.";
    }
    
    // Tutorials and how-to
    if (lowercaseMessage.includes('how') || lowercaseMessage.includes('tutorial') || lowercaseMessage.includes('guide')) {
        return "Help Resources\n\nFor tutorials and guides:\n1. Check our Help Center in the main menu\n2. Browse video tutorials\n3. Follow step-by-step guides\n\nCan't find what you need? Ask me a specific question or create a support ticket!";
    }
    
    // Greetings
    if (lowercaseMessage.includes('hello') || lowercaseMessage.includes('hi') || lowercaseMessage.includes('hey')) {
        return "Hello there!\n\nI'm your AI support assistant. I'm here to help you with:\n- Password and login issues\n- Account management\n- Billing questions\n- Technical problems\n- General guidance\n\nWhat can I help you with today?";
    }
    
    // Thank you responses
    if (lowercaseMessage.includes('thank') || lowercaseMessage.includes('thanks')) {
        return "You're welcome!\n\nI'm glad I could help! Is there anything else you need assistance with today?\n\nRemember, if you need more detailed help, you can always create a support ticket and our team will provide personalized assistance.";
    }
    
    // Default response for unmatched messages
    return "I'm here to help!\n\nI understand you're looking for assistance. For the best support:\n\n**Quick Help:** Try rephrasing your question - I can help with passwords, accounts, billing, and more.\n\n**Detailed Help:** Create a support ticket with specifics about your issue, and our team will provide personalized guidance.\n\nWhat would you like help with?";
};

// Enhanced chat endpoint with better error handling
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
        
        // Check message length
        if (message.length > 1000) {
            return res.status(400).json({
                success: false,
                error: 'Message is too long. Please keep it under 1000 characters.'
            });
        }
        
        // Generate AI response
        const aiResponse = await generateAIResponse(message, conversationHistory);
        
        // Log the interaction (optional)
        console.log('AI Chat Interaction:', {
            userId: req.user.id,
            message: message.substring(0, 100), 
            responseLength: aiResponse.length,
            timestamp: new Date().toISOString()
        });
        
        // Return response
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
        res.status(500).json({
            success: false,
            error: 'Failed to generate AI response. Please try again.'
        });
    }
});

// Enhanced suggestions endpoint with dynamic suggestions
router.get('/suggestions', protect, async (req, res) => {
    try {
        const suggestions = [
            "How do I reset my password?",
            "How can I contact support?",
            "What are your business hours?",
            "How do I update my profile?",
            "I'm experiencing a bug",
            "How do I cancel my subscription?",
            "I need help with billing",
            "How do I create a support ticket?",
            "Where can I find tutorials?",
            "How do I change my email address?"
        ];
        
        // Shuffle suggestions to provide variety
        const shuffled = suggestions.sort(() => 0.5 - Math.random());
        
        res.json({
            success: true,
            data: {
                suggestions: shuffled.slice(0, 6) 
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

// Enhanced feedback endpoint with database logging
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
        
        // Validate rating
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                error: 'Rating must be between 1 and 5'
            });
        }
        
        // Log feedback (you can save to database here)
        const feedbackData = {
            userId: req.user.id,
            messageId,
            rating,
            feedback: feedback || null,
            timestamp: new Date().toISOString()
        };
        
        console.log('AI Feedback Received:', feedbackData);
        
        // Save to database
        
        res.json({
            success: true,
            message: 'Thank you for your feedback! This helps us improve our AI assistant.'
        });
        
    } catch (error) {
        console.error('AI Feedback Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit feedback'
        });
    }
});

// New endpoint: Get AI chat history
router.get('/history', protect, async (req, res) => {
    try {
        // Implement chat history retrieval from database
        res.json({
            success: true,
            data: {
                history: [],
                message: 'Chat history feature coming soon!'
            }
        });
        
    } catch (error) {
        console.error('AI History Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch chat history'
        });
    }
});

// New endpoint: Check AI service status
router.get('/status', protect, async (req, res) => {
    try {
        // Test Gemini AI connection
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