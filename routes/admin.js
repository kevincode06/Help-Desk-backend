const express = require('express');
const {
    getAllTickets,
    getAllUsers,
    getAdminStats,
    updateTicketStatus,
    deleteTicket,
    updateUserRole
} = require('../controllers/admin');

const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');

// All admin routes require authentication and admin role
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