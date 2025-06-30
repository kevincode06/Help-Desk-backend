const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
    },
    status: {
        type: String, 
        enum: ['open', 'awaiting_response', 'resolved', 'closed', 'in-progress'],
        default: 'open',
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    }, 
    user: {
       type: mongoose.Schema.ObjectId,
       ref: 'User',
       required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }, 
    conversation: [
      {
        sender: {
            type: String, 
            enum: ['user', 'ai', 'admin'],
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        sentAt: {
            type: Date,
            default: Date.now,
        },
      },
    ],
});

// update the updatedAt field before saving
TicketSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});


module.exports = mongoose.model('Ticket', TicketSchema);