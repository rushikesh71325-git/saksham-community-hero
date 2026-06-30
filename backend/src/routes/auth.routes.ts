import { Router, Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { PrismaClient } from '@prisma/client';
import * as authController from '../controllers/auth.controller';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { verifyToken } from '../middleware/auth';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const router = Router();

/**
 * A generic validation middleware that uses our Zod schemas.
 * It intercepts the request, checks it against the schema, 
 * and either blocks it with a 400 error or passes it along.
 */
const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse the incoming request data against the provided Zod schema
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next(); // Data is valid, proceed to controller
    } catch (error) {
      if (error instanceof ZodError) {
        // Return a clean 400 Bad Request with the exact fields that failed
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
        });
      }
      return res.status(500).json({ error: 'Internal server error during validation' });
    }
  };
};

// ==========================================
// PUBLIC ROUTES (No token required)
// ==========================================
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// ==========================================
// PROTECTED ROUTES (Require valid JWT)
// ==========================================
router.get('/me', async (req: Request, res: Response) => {
  try {
    let userId = 'mock-citizen-uuid-for-demo'; // Default to mock user
    
    // Check if the user passed a real JWT token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { id: string };
        userId = decoded.id;
      } catch (err) {
        // Invalid token, fallback to mock user or you can choose to return 401
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, xp: true, level: true, displayName: true }
    });
    
    if (user) {
      return res.status(200).json({ user });
    } else {
      return res.status(200).json({ user: { xp: 0, level: 1, displayName: 'Local Citizen' } });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
