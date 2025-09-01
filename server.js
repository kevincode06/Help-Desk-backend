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

// Load environment variables
dotenv.config();

// Connect DB
connectDB();

const app = express();

// CORS - Updated to allow Vercel domains
app.use(cors({
  origin: [
   'http://localhost:3000',
    'https://help-desk-frontend-rust.vercel.app', 
    'https://help-desk-frontend-g6uj024zz-kevincode06s-projects.vercel.app',
    'https://*.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// check routes 
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Help Desk API is running!',
    version: 'v1',
    status: 'active',
    endpoints: ['/api/v1/auth', '/api/v1/tickets', '/api/v1/ai', '/api/v1/admin'],
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1', (req, res) => {
  res.status(200).json({ 
    message: 'Help Desk API v1',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

// API Routes
const aiRoutes = require('./routes/ai');
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const adminRoutes = require('./routes/admin');

app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handler
app.use(errorHandler);

// Start server - Updated for better Render compatibility
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;