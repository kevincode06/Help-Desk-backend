const express = require('express');
const {
    getTickets,
    getTicket,
    createTicket,
    updateTicket,
    deleteTicket,
    getUserTickets,     
    generateResponse,    
    addMessage,
    closeTicket
} = require('../controllers/tickets');

const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.route('/')
    .get(authorize('admin'), getTickets)
    .post(createTicket);

router.route('/my-tickets').get(getUserTickets); 
router.route('/:id/generate-response').post(generateResponse); 
router.route('/:id/message').post(addMessage);
router.route('/:id/close').patch(closeTicket);

router.route('/:id')
    .get(getTicket)
    .put(updateTicket)
    .delete(deleteTicket);

module.exports = router;