const Ticket = require('../models/Ticket');
const ErrorResponse = require('../utils/ErrorResponse');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { OpenAI } = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

//     Get all tickets
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

//  Get single ticket


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

    // Make sure user is ticket owner or admin
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

//     Create ticket

exports.createTicket = async (req, res, next) => {
  try {
    req.body.user = req.user.id;
    const ticket = await Ticket.create(req.body);

    // Add initial message to conversation
    ticket.conversation.push({
      sender: 'user',
      message: req.body.description,
    });

    // Check if user requested support
    if (req.body.description.toLowerCase().includes('support')) {
      ticket.status = 'awaiting_response';
      ticket.conversation.push({
        sender: 'admin',
        message: 'Your ticket has been escalated to a human support agent. Please wait for a response.',
      });
    } else {
      // Generate AI response
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful support assistant. Provide a concise and helpful response to the user's support ticket."
            },
            {
              role: "user",
              content: req.body.description
            }
          ],
          max_tokens: 150,
        });

        const aiResponse = completion.choices[0].message.content;
        
        ticket.conversation.push({
          sender: 'ai',
          message: aiResponse,
        });
      } catch (aiError) {
        console.error('AI Error:', aiError);
        ticket.conversation.push({
          sender: 'ai',
          message: 'Thank you for your ticket. Our automated system is currently unavailable. Your ticket has been logged and will be reviewed shortly.',
        });
      }
    }

    await ticket.save();

    res.status(201).json({
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

// Update ticket
exports.updateTicket = async (req, res, next) => {
  try {
    let ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Make sure user is ticket owner or admin
    if (ticket.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this ticket',
      });
    }

    // If user is admin, they can update status
    if (req.user.role === 'admin') {
      if (req.body.status) {
        ticket.status = req.body.status;
      }
    }

    // Add message to conversation if provided
    if (req.body.message) {
      ticket.conversation.push({
        sender: req.user.role === 'admin' ? 'admin' : 'user',
        message: req.body.message,
      });
    }

    await ticket.save();

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

// Get tickets for current user

exports.getMyTickets = async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ user: req.user.id });

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

//    Get ticket stats

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

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};