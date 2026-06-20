import express, { Application, Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import runRoutes from './routes/runRoutes';
import chatRoutes from './routes/chatRoutes';

// Architecture Imports
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import roomRoutes from './routes/roomRoutes';
import aiRoutes from './routes/aiRoutes';
import { handleSocketEngine } from './controllers/socketController';
import { socketAuthMiddleware } from './middlewares/socketAuthMiddleware';

// Load ecosystem variables
const envResult = dotenv.config({ path: path.resolve(__dirname, '../.env') });
if (envResult.error) {
  dotenv.config();
}

const app: Application = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_URL || 'http://localhost:3000';

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
  origin: CLIENT_ORIGIN, // 🚀 FIXED: Explicit local port mapping to safely exchange tokens
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json({ limit: '5mb' })); // Supports source-file uploads while keeping request bodies bounded.

// Operational Routers Mount
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/run', runRoutes);
app.use('/api/chat', chatRoutes);
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
    origin: CLIENT_ORIGIN, // 🚀 FIXED: Explicit socket origin binding
    methods: ['GET', 'POST'],
  },
});

io.use(socketAuthMiddleware);
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
