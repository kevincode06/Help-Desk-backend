const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/error'); 

// Handle uncaught exception 
process.on('uncaughtException', (err) => {
    console.log(`Error: ${err.message}`);
    console.log('Shutting down due to uncaught exception');
    process.exit(1);
});

// load env vars 
dotenv.config();

// Connect to database
connectDB();



const allowedOrigins = [ process.env.FRONTEND_URL ];
  
  app.use(cors({
    origin: function(origin, callback) {
      // allow requests with no origin (like Postman, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `CORS policy does not allow access from origin: ${origin}`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true, // enable cookies/auth headers
  }));
  
const auth = require('./routes/auth');
const tickets = require('./routes/tickets');
const adminRoutes = require('./routes/admin');

const app = express(); 

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/v1/auth', auth);
app.use('/api/v1/tickets', tickets);
app.use('/api/v1/admin', adminRoutes);


app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = app; 