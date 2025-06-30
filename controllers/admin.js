const Ticket = require('../models/Ticket');
const User = require('../models/User');

// @desc    Get all tickets for admin
// @route   GET /api/v1/admin/tickets
// @access  Private/Admin
const getAllTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        // Add userName field for frontend compatibility
        const ticketsWithUserName = tickets.map(ticket => ({
            ...ticket.toObject(),
            userName: ticket.user ? ticket.user.name : 'Unknown User'
        }));

        res.status(200).json({
            success: true,
            count: tickets.length,
            tickets: ticketsWithUserName
        });
    } catch (error) {
        console.error('Error fetching admin tickets:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching tickets'
        });
    }
};

// @desc    Get all users for admin
// @route   GET /api/v1/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching users'
        });
    }
};

// @desc    Get admin dashboard stats
// @route   GET /api/v1/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
    try {
        // Get ticket counts by status
        const ticketStats = await Ticket.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get total counts
        const totalTickets = await Ticket.countDocuments();
        const totalUsers = await User.countDocuments();

        // Initialize stats object
        const stats = {
            totalTickets,
            totalUsers,
            openTickets: 0,
            inProgressTickets: 0,
            resolvedTickets: 0,
            closedTickets: 0
        };

        // Map the aggregated results to stats object
        ticketStats.forEach(stat => {
            switch (stat._id) {
                case 'open':
                    stats.openTickets = stat.count;
                    break;
                case 'in-progress':
                case 'awaiting_response':
                    stats.inProgressTickets += stat.count;
                    break;
                case 'resolved':
                    stats.resolvedTickets = stat.count;
                    break;
                case 'closed':
                    stats.closedTickets = stat.count;
                    break;
            }
        });

        res.status(200).json({
            success: true,
            ...stats
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching stats'
        });
    }
};

// @desc    Update ticket status
// @route   PATCH /api/v1/admin/tickets/:id/status
// @access  Private/Admin
const updateTicketStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const ticketId = req.params.id;

        // Validate status
        const validStatuses = ['open', 'awaiting_response', 'resolved', 'closed', 'in-progress'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        ticket.status = status;
        ticket.updatedAt = Date.now();
        await ticket.save();

        // Populate user data for response
        await ticket.populate('user', 'name email');

        res.status(200).json({
            success: true,
            message: 'Ticket status updated successfully',
            ticket: {
                ...ticket.toObject(),
                userName: ticket.user ? ticket.user.name : 'Unknown User'
            }
        });
    } catch (error) {
        console.error('Error updating ticket status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating ticket status'
        });
    }
};

// @desc    Delete ticket
// @route   DELETE /api/v1/admin/tickets/:id
// @access  Private/Admin
const deleteTicket = async (req, res) => {
    try {
        const ticketId = req.params.id;

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        await Ticket.findByIdAndDelete(ticketId);

        res.status(200).json({
            success: true,
            message: 'Ticket deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting ticket:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting ticket'
        });
    }
};

// @desc    Update user role
// @route   PATCH /api/v1/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const userId = req.params.id;

        // Validate role
        const validRoles = ['user', 'admin', 'moderator'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role value'
            });
        }

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent admin from changing their own role (optional safety check)
        if (user._id.toString() === req.user.id && role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Cannot change your own admin role'
            });
        }

        user.role = role;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'User role updated successfully',
            user
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating user role'
        });
    }
};

module.exports = {
    getAllTickets,
    getAllUsers,
    getAdminStats,
    updateTicketStatus,
    deleteTicket,
    updateUserRole
};