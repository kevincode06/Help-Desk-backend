const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
    },
    status: {
        type: String, 
        enum: ['open', 'awaiting_response', 'resolved', 'closed'],
        default: 'open',
    },
    priority: {
        type: String,
        enum: ['minor', 'normal', 'critical'],
        default: 'normal',
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
            require: true,
        },
        sendAt: {
            type: Date,
            default: Date.now,
        },
      },
    ],
});

// update the updatedAt field before saving
TicketSchema.pre('save,', function (next) {
    this.updatedAt = Data.now();
    next();
});


module.exports = mongoose.model('Ticket', TicketSchema);