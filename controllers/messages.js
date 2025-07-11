const Message = require('../models/Message');

// send a message
exports.sendMessage = async (req, res) => {
    try {
        const {
            ticketId, message } = req.body;

            if (!ticketId || !message) {
                return res.status(400).json({ error: 'ticketId and message are required' });
            }

            const newMsg = await Message.create({
                ticketId,
                sender: req.user._id,
                message
            });

            res.status(201).json(newMsg);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error'});
    }
};

// get all message for ticket
exports.getMessages = async (req, res) => {
    try {
        const ticketId = req.params.ticketId;

        const messages = await Message.find({ ticketId })
        .sort({ sentAt: 1 })
        .populate('sender', 'name email role');

        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};