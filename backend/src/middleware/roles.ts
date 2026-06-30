import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

/**
 * A middleware factory that restricts access to specific roles.
 * IMPORTANT: This must be used in a route AFTER the verifyToken middleware.
 * 
 * @example
 * router.post('/issues/:id/resolve', verifyToken, requireRole([Role.OFFICER]), resolveIssue);
 */
export const requireRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Ensure req.user exists (meaning verifyToken successfully ran before this)
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required. Token missing or invalid.' });
    }

    // 2. Check if the user's role is inside the array of allowed roles
    if (!allowedRoles.includes(req.user.role as Role)) {
      return res.status(403).json({ 
        error: `Forbidden. This action requires one of the following roles: ${allowedRoles.join(', ')}` 
      });
    }

    // 3. User is authorized! Pass them through to the controller.
    next();
  };
};
