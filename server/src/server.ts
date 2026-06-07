import express, { Application, Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import runRoutes from './routes/runRoutes';

// Architecture Imports
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import roomRoutes from './routes/roomRoutes';
import aiRoutes from './routes/aiRoutes'; // 🚀 FIXED: Imported newly engineered AI Copilot Router
import { handleSocketEngine } from './controllers/socketController';

// Load ecosystem variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Fire up Connection Pool to MongoDB Atlas
connectDB();

// 1. 🛡️ System Design Principle: Rate Limiting Layer (DDoS Protection)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 300, // 🚀 FIXED: Increased limit to prevent aggressive frontend autologin rejection
  message: {
    message: 'Too many requests originating from this IP infrastructure, please retry later.'
  },
  standardHeaders: true, 
  legacyHeaders: false,  
});

// Apply rate limiting protection globally to all REST endpoints
app.use('/api/', apiLimiter);

// 2. 🔒 Strict Security Armor (Optimized for full-stack proxy routing)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // 🚀 FIXED: Allows local images/assets across ports
}));

app.use(cors({
  origin: 'http://localhost:3000', // 🚀 FIXED: Explicit local port mapping to safely exchange tokens
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json({ limit: '50kb' })); // 🚀 FIXED: Expanded body bounds to allow schema data bundles safely

// Operational Routers Mount
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/ai', aiRoutes); // 🚀 FIXED: Mounted AI Proxy route middleware channel securely
app.use('/api/run', runRoutes);
// Micro Health Monitor Checker
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'CodeSync Core Refined Engine Operational', 
    poolStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date() 
  });
});

// Central Exception Interceptor
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`💥 [SYSTEM ERROR INTERCEPT]: ${err.stack}`);
  res.status(500).json({
    message: 'An internal application pipeline error has occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Bind Server Context Layer Natively
const server = http.createServer(app);

// 3. 🔌 Scalable Sockets Connection Tuning
const io = new Server(server, {
  pingTimeout: 60000,  
  pingInterval: 25000, 
  cors: {
    origin: 'http://localhost:3000', // 🚀 FIXED: Explicit socket origin binding
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => handleSocketEngine(io, socket));

// 4. 🛑 Graceful Shutdown Engineering Handler (Zero Data Loss Pattern)
const handleGracefulExit = () => {
  console.log('⚠️ [SHUTDOWN SIGNAL RECEIVED]: Closing active network channels gracefully...');
  
  server.close(async () => {
    console.log('🛑 HTTP Server connection pooling offline.');
    await mongoose.connection.close();
    console.log('🛢️ MongoDB Atlas cluster connections cleanly released.');
    process.exit(0);
  });
};

// Listen for process termination hooks from operating system layer
process.on('SIGTERM', handleGracefulExit); 
process.on('SIGINT', handleGracefulExit);  

server.listen(PORT, () => {
  console.log(`⚡ CodeSync Refined Engine blazing forward on port ${PORT}`);
});