import { Worker, Job } from 'bullmq';
import { redisClient } from '../config/redis';
import { QUEUE_NAMES } from '../services/queue.service';
import { io } from '../config/socket';

/**
 * Step 7.2: The Notification Worker
 * This background process listens to the NOTIFICATIONS queue. 
 * Whenever the AI finishes routing, or an officer updates an issue, a job is dropped here.
 * This worker picks it up and pushes a real-time WebSocket alert directly to the user's phone!
 */
export const notificationWorker = new Worker(
  QUEUE_NAMES.NOTIFY,
  async (job: Job) => {
    // Extract the notification details
    const { userId, wardId, issueId, title, message, type } = job.data;
    
    console.log(`🔔 [NotificationWorker] Sending '${type}' alert...`);

    try {
      // Construct the JSON payload exactly how the React frontend expects it
      const payload = {
        title,
        message,
        issueId,
        type, // e.g., 'STATUS_UPDATE', 'AI_CLASSIFIED', 'NEW_ISSUE_IN_WARD'
        timestamp: new Date().toISOString()
      };

      // 1. Direct User Notification (e.g., Alerting a Citizen that their pothole was just fixed)
      if (userId) {
        // We use the exact 'user:123' room we created in socket.ts
        io.to(`user:${userId}`).emit('notification', payload);
        console.log(`✅ [NotificationWorker] Pushed to User: ${userId}`);
      }

      // 2. Ward-Wide Broadcast (e.g., Alerting all Civic Officers in Downtown Ward about a CRITICAL issue)
      if (wardId && type === 'NEW_ISSUE_IN_WARD') {
        io.to(`ward:${wardId}`).emit('notification', payload);
        console.log(`✅ [NotificationWorker] Broadcasted to Ward: ${wardId}`);
      }
      
      // 3. Issue Subscribers (e.g., 50 citizens upvoted a pothole and are watching it)
      if (issueId && type === 'STATUS_UPDATE') {
        io.to(`issue:${issueId}`).emit('notification', payload);
        console.log(`✅ [NotificationWorker] Broadcasted to Issue Subscribers: ${issueId}`);
      }
      
    } catch (error) {
      console.error(`❌ [NotificationWorker] Failed to send push notification`, error);
      // We throw the error so BullMQ knows it failed and attempts to retry it later!
      throw error; 
    }
  },
  {
    connection: redisClient as any,
    concurrency: 10 // Emitting WebSockets is incredibly lightweight. We can blast 10 jobs simultaneously!
  }
);

notificationWorker.on('error', (err) => {
  console.error('🚨 [NotificationWorker] Critical System Error:', err);
});
