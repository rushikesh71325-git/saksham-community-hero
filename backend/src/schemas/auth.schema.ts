import { z } from 'zod';

/**
 * Zod schema for User Registration.
 * In Community Hero, citizens often use phone numbers, while officers use emails.
 * This schema requires at least one of them to be present.
 */
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').optional(),
    phone: z.string().min(10, 'Phone must be at least 10 digits').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  }).refine((data) => data.email || data.phone, {
    message: "Either email or phone is required to register",
    path: ["email"], // Attaches the error to the email field visually
  })
});

/**
 * Zod schema for User Login.
 */
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').optional(),
    phone: z.string().optional(),
    password: z.string().min(1, 'Password is required'),
  }).refine((data) => data.email || data.phone, {
    message: "Either email or phone is required to login",
    path: ["email"],
  })
});

/**
 * Zod schema for Anonymous citizen login.
 * Allows a citizen to report issues without creating an account, 
 * tracked purely by their device fingerprint.
 */
export const anonymousLoginSchema = z.object({
  body: z.object({
    fingerprint: z.string().min(10, 'Valid device fingerprint required'),
  })
});
