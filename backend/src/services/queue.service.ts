import { Queue } from 'bullmq';
import { redisClient } from '../config/redis';

/**
 * Define our exact Queue names.
 * In the original MeraWard architecture, these were Kafka topics 
 * (e.g., ticket.media.created, ticket.ai.process). 
 * We use BullMQ queues to achieve the same asynchronous, non-blocking flow.
 */
export const QUEUE_NAMES = {
  MEDIA_PROCESS: 'media_process', // For resizing/uploading images to Cloudinary
  AI_CLASSIFY: 'ai_classify',     // For sending data to Gemini Flash
  GIS_ROUTE: 'gis_route',         // For doing PostGIS spatial lookups
  NOTIFY: 'notify'                // For firing off real-time Socket.io events
} as const;

// We set default behaviors so our system is resilient.
// If Gemini API drops temporarily, BullMQ will automatically try 3 times.
const defaultQueueOptions = {
  connection: redisClient as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // Waits 2s, then 4s, then 8s between retries
    },
    removeOnComplete: true, // Automatically delete the job from Redis once done to save memory
    removeOnFail: 100,      // But keep the last 100 failed ones so we can debug them
  }
};

// Initialize and export the actual queues
export const mediaQueue = new Queue(QUEUE_NAMES.MEDIA_PROCESS, defaultQueueOptions);
export const aiQueue = new Queue(QUEUE_NAMES.AI_CLASSIFY, defaultQueueOptions);
export const gisQueue = new Queue(QUEUE_NAMES.GIS_ROUTE, defaultQueueOptions);
export const notifyQueue = new Queue(QUEUE_NAMES.NOTIFY, defaultQueueOptions);

console.log('✅ BullMQ Message Queues initialized successfully');
