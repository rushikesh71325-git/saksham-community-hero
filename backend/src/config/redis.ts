import { Redis } from 'ioredis';
import { config } from './index';

/**
 * Initialize the Redis client.
 * In the MeraWard architecture, this replaces ElastiCache and powers
 * our BullMQ job queues (which serve as our Kafka replacement).
 */
export const redisClient = new Redis(config.redis.url, {
  // Required setting for BullMQ to function correctly without throwing errors
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Listeners for monitoring connection health
redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis connection error. Please check REDIS_URL in .env');
  console.error('If you do not have Redis installed locally, you can use a free Upstash database.');
  console.error(err.message);
});
