const express = require('express');
const {
    getTickets,
    getTicket,
    createTicket,
    updateTicket,
    getMyTickets,
    getTicketStats,
    generateAIResponse, 
} = require('../controllers/tickets');

const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.route('/')
    .get(authorize('admin'), getTickets)
    .post(createTicket);

router.route('/my-tickets').get(getMyTickets);
router.route('/stats').get(authorize('admin'), getTicketStats);


router.route('/:id/ai-response').post(generateAIResponse);

router.route('/:id')
    .get(getTicket)
    .put(updateTicket);

module.exports = router;