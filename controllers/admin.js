const Ticket = require("../models/Ticket");
const User = require("../models/User");

const getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    // added username for frontend
    const ticketsWithUserName = tickets.map((ticket) => ({
      ...ticket.toObject(),
      userName: ticket.user ? ticket.user.name : "Unknown User",
    }));

    // successful res with ticket data
    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets: ticketsWithUserName,
    });
  } catch (error) {
    // the error for debugging
    console.error("Error fetching admin tickets:", error);

    // send error response to frontend
    res.status(500).json({
      success: false,
      message: "Server error while fetching tickets",
    });
  }
};

// all user from the database for admin,

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    // return users dor admin dashboard
    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
    });
  }
};

// Calculates ticket counts by status and total user count

const getAdminStats = async (req, res) => {
  try {
    // Use MongoDB aggregation to group tickets by status and count them
    const ticketStats = await Ticket.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get total counts for overview cards
    const totalTickets = await Ticket.countDocuments();
    const totalUsers = await User.countDocuments();

    // This ensures all stats are present even if no tickets exist for a status
    const stats = {
      totalTickets,
      totalUsers,
      openTickets: 0,
      inProgressTickets: 0,
      resolvedTickets: 0,
      closedTickets: 0,
    };

    // converts the database results into a format the frontend
    ticketStats.forEach((stat) => {
      switch (stat._id) {
        case "open":
          stats.openTickets = stat.count;
          break;
        case "in-progress":
        case "awaiting_response":
          // Group both in-progress and awaiting response as "in progress"
          stats.inProgressTickets += stat.count;
          break;
        case "resolved":
          stats.resolvedTickets = stat.count;
          break;
        case "closed":
          stats.closedTickets = stat.count;
          break;
      }
    });

    // Return all stats in a flat object for easy frontend consumption
    res.status(200).json({
      success: true,
      ...stats,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching stats",
    });
  }
};

// Validates the new status and updates the ticket accordingly

const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ticketId = req.params.id;

    // Define valid status values to prevent invalid updates
    const validStatuses = [
      "open",
      "awaiting_response",
      "resolved",
      "closed",
      "in-progress",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    // Find the ticket first to ensure it exists
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Update the ticket status and timestamp
    ticket.status = status;
    ticket.updatedAt = Date.now();
    await ticket.save();

    // Populate user data for the response so frontend has complete info
    await ticket.populate("user", "name email");

    // Return updated ticket with user name
    res.status(200).json({
      success: true,
      message: "Ticket status updated successfully",
      ticket: {
        ...ticket.toObject(),
        userName: ticket.user ? ticket.user.name : "Unknown User",
      },
    });
  } catch (error) {
    console.error("Error updating ticket status:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating ticket status",
    });
  }
};

// delete ticket

const deleteTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;

    // Verify the ticket exists before attempting deletion
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Permanently remove the ticket from database
    await Ticket.findByIdAndDelete(ticketId);

    // Confirm successful deletion
    res.status(200).json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting ticket",
    });
  }
};

// Includes safety check to prevent admins from demoting themselves

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    // Validate that the role is one of the allowed values
    const validRoles = ["user", "admin", "moderator"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role value",
      });
    }

    // Find the user and exclude password from the result
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // This prevents system lockout scenarios
    if (user._id.toString() === req.user.id && role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "Cannot change your own admin role",
      });
    }

    // Update the user's role and save to database
    user.role = role;
    await user.save();

    // Return updated user information
    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating user role",
    });
  }
};

// Export all controller functions for use in routes
module.exports = {
  getAllTickets,
  getAllUsers,
  getAdminStats,
  updateTicketStatus,
  deleteTicket,
  updateUserRole,
};
