import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Locally matching our extended request contract
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

interface DecodedToken {
  id: string;
  iat: number;
  exp: number;
}

/**
 * @desc Middleware to protect routes and verify JWT token signatures
 */
export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  let token;

  // 1. Check if token is being passed inside the HTTP Authorization Header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Token string looks like: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpX..."
      // Splitting by space gives us the raw token at index 1
      token = req.headers.authorization.split(' ')[1];

      // 2. Decode and verify token signature using our secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as DecodedToken;

      // 3. Inject the authenticated user's ID into the request object payload
      req.user = { id: decoded.id };

      // 4. Everything matches! Pass control to the next controller layer
      next();
    } catch (error) {
      res.status(401).json({ message: 'Session expired or token verification failed' });
    }
  } else {
    res.status(401).json({ message: 'Access denied, authorization token missing' });
  }
};