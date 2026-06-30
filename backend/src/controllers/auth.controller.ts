import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config';

// Instantiate Prisma (this connects to our PostgreSQL database)
const prisma = new PrismaClient();

/**
 * Helper to generate our short-lived Access Token and long-lived Refresh Token.
 */
const generateTokens = (userId: string, role: string) => {
  const accessToken = jwt.sign({ id: userId, role }, config.jwt.secret, {
    expiresIn: config.jwt.accessExpires as any,
  });
  
  const refreshToken = jwt.sign({ id: userId, role }, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpires as any,
  });
  
  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, phone, password, displayName } = req.body;

    // 1. Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phone: phone || undefined }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or phone already exists' });
    }

    // 2. Hash the password securely
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Create the user in PostgreSQL
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        displayName,
        role: 'CITIZEN', // Default role for public registration
      }
    });

    // 4. Generate JWT tokens
    const tokens = generateTokens(user.id, user.role);

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user.id, email: user.email, phone: user.phone, role: user.role },
      ...tokens
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, phone, password } = req.body;

    // 1. Find user by email OR phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phone: phone || undefined }
        ]
      }
    });

    // 2. Verify user exists and has a password
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3. Compare passwords
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 4. Generate new tokens
    const tokens = generateTokens(user.id, user.role);

    res.status(200).json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, phone: user.phone, role: user.role },
      ...tokens
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

    // Verify the token signature and expiration
    const decoded = jwt.verify(refreshToken, config.jwt.secret) as { id: string, role: string };
    
    // Generate a fresh set of tokens
    const tokens = generateTokens(decoded.id, decoded.role);
    
    res.status(200).json(tokens);
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

export const logout = async (req: Request, res: Response) => {
  // In a robust system, we would add the token to a Redis blacklist here.
  // For now, we simply rely on the frontend to delete the token from its storage.
  res.status(200).json({ message: 'Logged out successfully' });
};
