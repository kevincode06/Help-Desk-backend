const Ticket = require('../models/Ticket');
const ErrorResponse = require('../utils/ErrorResponse');

// Get All Tickets 
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

// Get Single Ticket 
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

// Create Ticket 
exports.createTicket = async (req, res, next) => {
    try {
        req.body.user = req.user.id;
        
        // Set default category and priority if not provided
        if (!req.body.category) {
            req.body.category = 'general';
        }
        if (!req.body.priority) {
            req.body.priority = 'medium';
        }

        const ticket = await Ticket.create(req.body);

        // Add initial user message to conversation
        ticket.conversation.push({
            sender: 'user',
            message: req.body.description,
        });

        // Add initial response
        ticket.conversation.push({
            sender: 'system',
            message: `Thank you for contacting our support team. We have received your ${req.body.category} ticket and will respond as soon as possible. Our typical response time is within 24 hours.`,
        });

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

// Generate Response 
exports.generateResponse = async (req, res, next) => {
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

        // Generate basic response
        const response = `Thank you for your message. Our support team has been notified and will respond to your ${ticket.category} ticket as soon as possible.`;

        // Add response to conversation
        ticket.conversation.push({
            sender: 'system',
            message: response,
        });

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
        res.status(500).json({
            success: false,
            message: 'Unable to generate response',
        });
    }
};

// Add Message to Ticket 
exports.addMessage = async (req, res, next) => {
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

        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required',
            });
        }

        // Add user message to conversation
        ticket.conversation.push({
            sender: req.user.role === 'admin' ? 'admin' : 'user',
            message: message,
        });

        // Update ticket status if it was closed
        if (ticket.status === 'closed') {
            ticket.status = 'open';
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

// Update Ticket 
exports.updateTicket = async (req, res, next) => {
    try {
        let ticket = await Ticket.findById(req.params.id);

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

        // Only allow certain fields to be updated
        const allowedFields = ['title', 'description', 'category', 'priority', 'status'];
        const filteredBody = {};
        
        Object.keys(req.body).forEach(key => {
            if (allowedFields.includes(key)) {
                filteredBody[key] = req.body[key];
            }
        });

        ticket = await Ticket.findByIdAndUpdate(
            req.params.id,
            filteredBody,
            {
                new: true,
                runValidators: true,
            }
        ).populate({
            path: 'user',
            select: 'name email',
        });

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

// Delete Ticket 
exports.deleteTicket = async (req, res, next) => {
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found',
            });
        }

        // Check authorization (only admin or ticket owner can delete)
        if (ticket.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to delete this ticket',
            });
        }

        await ticket.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Ticket deleted successfully',
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

// Get Tickets by User 
exports.getUserTickets = async (req, res, next) => {
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

// Close Ticket 
exports.closeTicket = async (req, res, next) => {
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

        ticket.status = 'closed';
        await ticket.save();

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