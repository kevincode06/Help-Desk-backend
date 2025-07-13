const Message = require('../models/Message');

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { ticketId, text } = req.body;

    // Validate input
    if (!ticketId || !text) {
      return res.status(400).json({ error: 'ticketId and message are required' });
    }

    const newMessage = await Message.create({
      ticketId,
      sender: req.user._id,
      message: text
    });

    res.status(201).json({
      success: true,
      data: newMessage
    });
  } catch (err) {
    console.error('Send Message Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all messages for a ticket
exports.getMessages = async (req, res) => {
  try {
    const ticketId = req.params.ticketId;

    const messages = await Message.find({ ticketId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name email role');

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (err) {
    console.error('Get Messages Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
