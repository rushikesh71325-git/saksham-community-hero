import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

// ----------------------------------------------------------------------
// TypeScript Trick: Extend the Express Request object globally
// so we can attach `req.user` without TypeScript yelling at us.
// ----------------------------------------------------------------------
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

/**
 * Middleware to verify JWT tokens on protected routes.
 * If valid, it attaches the decoded user data to `req.user`.
 */
export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Look for the token in the headers
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // 2. Extract the actual token string (skipping "Bearer ")
    const token = authHeader.split(' ')[1];
    
    // 3. Verify it against our secret
    const decoded = jwt.verify(token, config.jwt.secret) as { id: string, role: string };
    
    // 4. Attach the decoded user payload to the request for the next function to use
    req.user = decoded;
    
    // 5. Hand control over to the actual route handler
    next();
  } catch (error) {
    // If jwt.verify fails (expired, tampered, bad signature), it throws an error
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};
