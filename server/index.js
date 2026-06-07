const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./src/config/database');
const { CORS_ORIGIN, PORT } = require('./src/config/constants');
const authRoutes = require('./src/routes/auth');
const healthRoutes = require('./src/routes/health');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Create HTTP server for WebSocket support
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);

// Basic health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CodeSync API Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ CORS enabled for: ${CORS_ORIGIN}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});