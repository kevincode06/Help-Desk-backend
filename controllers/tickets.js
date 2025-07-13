const Ticket = require('../models/Ticket');
const ErrorResponse = require('../utils/ErrorResponse');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Gemini AI 
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Enhanced AI response generation function
const generateAIResponseText = async (prompt, conversationHistory = []) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        
        // Build context from conversation history
        let contextPrompt = `You are a helpful customer support AI assistant. Based on the following conversation history and the latest message, provide a professional, helpful response.

Conversation History:
${conversationHistory.map(msg => `${msg.sender}: ${msg.message}`).join('\n')}

Latest Message: ${prompt}

Please provide a helpful response that:
1. Acknowledges the user's issue
2. Provides relevant troubleshooting steps or information
3. Is concise but thorough
4. Maintains a friendly, professional tone
5. If the issue seems complex or requires human intervention, suggest escalating to a support agent

Response:`;

        const result = await model.generateContent(contextPrompt);
        return result.response.text();
    } catch (error) {
        console.error('AI Error:', error);
        throw new Error('AI service temporarily unavailable');
    }
};

// Check if message contains support escalation keywords
const checkForSupportEscalation = (message) => {
    const supportKeywords = [
        'support', 'urgent', 'critical', 'emergency', 'escalate', 
        'supervisor', 'manager', 'human', 'agent', 'help me',
        'not working', 'broken', 'frustrated', 'angry'
    ];
    const lowerMessage = message.toLowerCase();
    return supportKeywords.some(keyword => lowerMessage.includes(keyword));
};

// ======= Get All Tickets =======
exports.getTickets = async (req, res, next) => {
    try {
        const tickets = await Ticket.find().populate({
            path: 'user',
            select: 'name email',
        });

        res.status(200).json({
            success: true,
            count: tickets.length,
            data: tickets,
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

// ======= Get Single Ticket =======
exports.getTicket = async (req, res, next) => {
    try {
        const ticket = await Ticket.findById(req.params.id).populate({
            path: 'user',
            select: 'name email',
        });

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found',
            });
        }

        if (ticket.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this ticket',
            });
        }

        res.status(200).json({
            success: true,
            data: ticket,
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

// ======= Create Ticket =======
exports.createTicket = async (req, res, next) => {
    try {
        req.body.user = req.user.id;
        const ticket = await Ticket.create(req.body);

        // Add initial message
        ticket.conversation.push({
            sender: 'user',
            message: req.body.description,
        });

        // Check if ticket needs support escalation
        const needsSupport = checkForSupportEscalation(req.body.description);

        if (needsSupport) {
            // Escalate to human support
            ticket.status = 'awaiting_response';
            ticket.conversation.push({
                sender: 'admin',
                message: 'Your ticket has been escalated to a human support agent due to the nature of your request. Please wait for a response from our support team.',
            });
        } else {
            // Generate AI response
            try {
                const aiResponse = await generateAIResponseText(
                    req.body.description,
                    []
                );

                ticket.conversation.push({
                    sender: 'ai',
                    message: aiResponse,
                });

                // Set status to awaiting response if AI suggests human intervention
                if (aiResponse.toLowerCase().includes('escalate') || 
                    aiResponse.toLowerCase().includes('support agent') ||
                    aiResponse.toLowerCase().includes('human assistance')) {
                    ticket.status = 'awaiting_response';
                }

            } catch (aiError) {
                console.error('AI Error:', aiError);
                ticket.conversation.push({
                    sender: 'ai',
                    message: 'Thank you for your ticket. Our automated system is currently unavailable. Your ticket has been logged and will be reviewed by our support team shortly.',
                });
                ticket.status = 'awaiting_response';
            }
        }

        await ticket.save();

        // Return populated ticket
        const populatedTicket = await Ticket.findById(ticket._id).populate({
            path: 'user',
            select: 'name email',
        });

        res.status(201).json({
            success: true,
            data: populatedTicket,
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

// ======= Generate AI Response (New Function) =======
exports.generateAIResponse = async (req, res, next) => {
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found',
            });
        }

        // Check authorization
        if (ticket.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this ticket',
            });
        }

        // Get the latest user message or use the description
        const latestMessage = ticket.conversation.length > 0 
            ? ticket.conversation[ticket.conversation.length - 1].message 
            : ticket.description;

        // Generate AI response
        const aiResponse = await generateAIResponseText(
            latestMessage,
            ticket.conversation
        );

        // Add AI response to conversation
        ticket.conversation.push({
            sender: 'ai',
            message: aiResponse,
        });

        await ticket.save();

        res.status(200).json({
            success: true,
            aiReply: aiResponse,
            data: ticket,
        });

    } catch (err) {
        console.error('AI Response Error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to generate AI response: ' + err.message,
        });
    }
};

// ======= Update Ticket =======
exports.updateTicket = async (req, res, next) => {
    try {
        let ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found',
            });
        }

        if (ticket.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to update this ticket',
            });
        }

        // Update status if provided (admin only)
        if (req.user.role === 'admin' && req.body.status) {
            ticket.status = req.body.status;
        }

        // Add new message if provided
        if (req.body.message) {
            ticket.conversation.push({
                sender: req.user.role === 'admin' ? 'admin' : 'user',
                message: req.body.message,
            });

            // Auto-generate AI response for user messages (if not admin)
            if (req.user.role !== 'admin' && ticket.status !== 'closed') {
                try {
                    const aiResponse = await generateAIResponseText(
                        req.body.message,
                        ticket.conversation
                    );

                    ticket.conversation.push({
                        sender: 'ai',
                        message: aiResponse,
                    });
                } catch (aiError) {
                    console.error('AI Error in update:', aiError);
                    // Continue without AI response if it fails
                }
            }
        }

        await ticket.save();

        // Return populated ticket
        const populatedTicket = await Ticket.findById(ticket._id).populate({
            path: 'user',
            select: 'name email',
        });

        res.status(200).json({
            success: true,
            data: populatedTicket,
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

// ======= Get Tickets for Logged-in User =======
exports.getMyTickets = async (req, res, next) => {
    try {
        const tickets = await Ticket.find({ user: req.user.id }).populate({
            path: 'user',
            select: 'name email',
        });

        res.status(200).json({
            success: true,
            count: tickets.length,
            data: tickets,
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

// ======= Get Ticket Stats =======
exports.getTicketStats = async (req, res, next) => {
    try {
        const stats = await Ticket.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ]);

        // Get additional stats
        const totalTickets = await Ticket.countDocuments();
        const aiResponseCount = await Ticket.countDocuments({
            'conversation.sender': 'ai'
        });
        const supportEscalations = await Ticket.countDocuments({
            status: 'awaiting_response'
        });

        res.status(200).json({
            success: true,
            data: {
                statusBreakdown: stats,
                totalTickets,
                aiResponseCount,
                supportEscalations,
            },
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};