import dotenv from 'dotenv';
import path from 'path';

// Load .env from the root of the backend folder
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Helper function to get environment variables with fallback values.
 * Throws an error if a required variable is missing.
 */
const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (value === undefined) {
    throw new Error(`CRITICAL: Environment variable ${key} is missing!`);
  }
  return value;
};

export const config = {
  port: parseInt(getEnv('PORT', '3000'), 10),
  nodeEnv: getEnv('NODE_ENV', 'development'),
  frontendUrl: getEnv('FRONTEND_URL', 'http://localhost:5173'),
  
  db: {
    url: getEnv('DATABASE_URL'),
  },
  
  redis: {
    url: getEnv('REDIS_URL'),
  },
  
  jwt: {
    secret: getEnv('JWT_SECRET'),
    accessExpires: getEnv('JWT_ACCESS_EXPIRES', '15m'),
    refreshExpires: getEnv('JWT_REFRESH_EXPIRES', '30d'),
  },
  
  gemini: {
    apiKey: getEnv('GEMINI_API_KEY'),
  },
  
  cloudinary: {
    cloudName: getEnv('CLOUDINARY_CLOUD_NAME'),
    apiKey: getEnv('CLOUDINARY_API_KEY'),
    apiSecret: getEnv('CLOUDINARY_API_SECRET'),
  },
  
  nominatimUrl: getEnv('NOMINATIM_BASE_URL', 'https://nominatim.openstreetmap.org/reverse'),
};
