const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/error');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.message}`);
  console.log('Shutting down due to uncaught exception');
  process.exit(1);
});

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Import routes
const auth = require('./routes/auth');
const tickets = require('./routes/tickets');
const adminRoutes = require('./routes/admin');

const app = express();

// Body parser middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Route handlers
app.use('/api/v1/auth', auth);
app.use('/api/v1/tickets', tickets);
app.use('/api/v1/admin', adminRoutes);

// Fallback route for undefined paths
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = app;