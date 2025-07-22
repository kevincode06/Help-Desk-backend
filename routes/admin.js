const express = require('express');
const {
    getAllTickets,
    getAllUsers,
    getAdminStats,
    updateTicketStatus,
    deleteTicket,
    updateUserRole,
} = require('../controllers/admin'); 
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// Protect all admin routes
router.use(protect);
router.use(authorize('admin'));

// Admin ticket routes
router.get('/tickets', getAllTickets);
router.patch('/tickets/:id/status', updateTicketStatus);
router.delete('/tickets/:id', deleteTicket);

// Admin user routes
router.get('/users', getAllUsers);
router.patch('/users/:id/role', updateUserRole);

// Admin stats route
router.get('/stats', getAdminStats);

module.exports = router;