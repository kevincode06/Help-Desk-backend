const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { sendMessage, getMessages } = require('../controllers/messages');

// api for message
router.post('/', protect, sendMessage);

// api messages/:ticketId
router.get('/:ticketId', protect, getMessages);

module.exports = router;