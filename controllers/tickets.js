const Ticket = require('../models/Ticket');
const ErrorResponse = require('../utils/ErrorResponse');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Gemini AI 
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

    // If request includes "support", assign to human
    if (req.body.description.toLowerCase().includes('support')) {
      ticket.status = 'awaiting_response';
      ticket.conversation.push({
        sender: 'admin',
        message: 'Your ticket has been escalated to a human support agent. Please wait for a response.',
      });
    } else {
      //  Gemini AI response
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const result = await model.generateContent(req.body.description);
        const aiResponse = result.response.text();

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

    if (req.user.role === 'admin' && req.body.status) {
      ticket.status = req.body.status;
    }

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

// ======= Get Tickets for Logged-in User =======
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
