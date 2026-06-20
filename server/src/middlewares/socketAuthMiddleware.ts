import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/auth';

export interface DecodedToken {
  id: string;
  iat: number;
  exp: number;
}

export const socketAuthMiddleware = (socket: Socket, next: any) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication token missing'));
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      getJwtSecret()
    ) as DecodedToken;

    // Attach user info to socket for later use
    (socket as any).userId = decoded.id;
    (socket as any).authenticatedAt = new Date(decoded.iat * 1000);

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new Error('Token expired'));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new Error('Invalid token'));
    }
    next(new Error('Authentication failed'));
  }
};

// Verify user can access a specific room
export const verifyRoomAccess = async (userId: string, roomId: string): Promise<boolean> => {
  try {
    // Import at function level to avoid circular dependencies
    const { Room } = await import('../models/roomModel');

    const room = await Room.findOne({ roomId });
    if (!room) return false;

    // Check if user is the admin or in permitted users
    const isAdmin = room.admin.toString() === userId;
    const isPermitted = room.permittedUsers.some((id: any) => id.toString() === userId);

    return isAdmin || isPermitted;
  } catch (error) {
    console.error('Room access verification failed:', error);
    return false;
  }
};

// Verify user owns a file
export const verifyFileAccess = async (
  userId: string,
  roomId: string,
  filePath: string
): Promise<boolean> => {
  try {
    const canAccess = await verifyRoomAccess(userId, roomId);
    if (!canAccess) return false;

    // File access is determined by room access
    // Additional file-level permissions can be added here
    return true;
  } catch (error) {
    console.error('File access verification failed:', error);
    return false;
  }
};

export default {
  socketAuthMiddleware,
  verifyRoomAccess,
  verifyFileAccess,
};
