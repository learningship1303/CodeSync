import { Request, Response, NextFunction } from 'express';
import { Room } from '../models/roomModel';
import { User } from '../models/userModel';

// Extend Express Request to include authenticated user
export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: any;
}

// Verify user has access to room
export const verifyRoomAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const roomId = req.params.roomId || req.body.roomId;

    if (!userId || !roomId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Find room
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is admin or permitted
    const isAdmin = room.admin.toString() === userId;
    const isPermitted = room.permittedUsers.some((id: any) => id.toString() === userId);

    if (!isAdmin && !isPermitted) {
      return res.status(403).json({ message: 'Access denied to this room' });
    }

    // Attach room to request for later use
    req.body.room = room;
    next();
  } catch (error) {
    console.error('Room access verification failed:', error);
    res.status(500).json({ message: 'Access verification failed' });
  }
};

// Verify user is room admin
export const verifyRoomAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const roomId = req.params.roomId || req.body.roomId;

    if (!userId || !roomId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is admin
    if (room.admin.toString() !== userId) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.body.room = room;
    next();
  } catch (error) {
    console.error('Admin verification failed:', error);
    res.status(500).json({ message: 'Admin verification failed' });
  }
};

// Verify user owns resource
export const verifyResourceOwnership = (resourceField: string = 'userId') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      const resourceUserId = req.body[resourceField] || req.params[resourceField];

      if (!userId || !resourceUserId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      if (userId !== resourceUserId) {
        return res.status(403).json({ message: 'You do not own this resource' });
      }

      next();
    } catch (error) {
      console.error('Ownership verification failed:', error);
      res.status(500).json({ message: 'Ownership verification failed' });
    }
  };
};

// Verify user email is verified
export const verifyEmailVerified = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Email verification required' });
    }

    next();
  } catch (error) {
    console.error('Email verification check failed:', error);
    res.status(500).json({ message: 'Email verification check failed' });
  }
};

export default {
  verifyRoomAccess,
  verifyRoomAdmin,
  verifyResourceOwnership,
  verifyEmailVerified,
};
