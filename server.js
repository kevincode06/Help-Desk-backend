const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');      // Your DB connection logic
const errorHandler = require('./middlewares/error'); // Your custom error handler middleware

// Handle uncaught exceptions globally to avoid silent crashes
process.on('uncaughtException', (err) => {
    console.log(`Error: ${err.message}`);
    console.log('Shutting down due to uncaught exception');
    process.exit(1);
});

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB or your database
connectDB();

const auth = require('./routes/auth');          // Auth routes (register, login, etc.)
const tickets = require('./routes/tickets');    // Tickets routes
const adminRoutes = require('./routes/admin');  // Admin routes

const app = express();

// Parse incoming JSON requests
app.use(express.json());

// Enable CORS to allow frontend requests from different origin (important for local dev)
app.use(cors());

// Serve static files (optional, if you have a frontend build in /public)
app.use(express.static(path.join(__dirname, 'public')));

// Mount routes with prefix /api/v1
app.use('/api/v1/auth', auth);           // Auth routes e.g. POST /api/v1/auth/login
app.use('/api/v1/tickets', tickets);     // Tickets routes
app.use('/api/v1/admin', adminRoutes);   // Admin routes

// Use your custom error handler middleware for catching errors
app.use(errorHandler);

// Start server on the specified port (default 5000)
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = app;
