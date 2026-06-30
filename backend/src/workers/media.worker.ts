import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { redisClient } from '../config/redis';
import { QUEUE_NAMES } from '../services/queue.service';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret
});

const prisma = new PrismaClient();

/**
 * Step 4.3: The Media Worker
 * This is a background process that constantly listens to the MEDIA_PROCESS queue.
 * When a citizen submits a new issue with images, this worker wakes up, processes 
 * the images via Cloudinary, and links the final secure URLs to the Issue in PostgreSQL.
 */
export const mediaWorker = new Worker(
  QUEUE_NAMES.MEDIA_PROCESS,
  async (job: Job) => {
    // 1. Extract the data that was passed from our Issue Controller (Step 3.2)
    const { issueId, filePaths } = job.data as { issueId: string, filePaths: string[] };

    console.log(`📸 [MediaWorker] Processing ${filePaths.length} images for Issue: ${issueId}`);

    try {
      const uploadedUrls: string[] = [];
      
      // Upload each image to Cloudinary in the cloud!
      for (const filePath of filePaths) {
        console.log(`☁️ [MediaWorker] Uploading ${filePath} to Cloudinary...`);
        const result = await cloudinary.uploader.upload(filePath, { folder: 'saksham_issues' });
        uploadedUrls.push(result.secure_url);
      }

      // Update the database issue with the new permanent cloud URLs!
      await prisma.issue.update({
        where: { id: issueId },
        data: { imageUrls: uploadedUrls }
      });

      console.log(`✅ [MediaWorker] Successfully uploaded images to Cloudinary for Issue: ${issueId}`);
    } catch (error) {
      console.error(`❌ [MediaWorker] Failed to process media for Issue: ${issueId}`, error);
      throw error; 
    }
  },
  {
    connection: redisClient as any, // Bypass the structural typing mismatch
    concurrency: 5 // We can process up to 5 different citizens' uploads at the exact same time
  }
);

// Listen for global worker errors (e.g. if the Upstash Redis connection drops)
mediaWorker.on('error', (err) => {
  console.error('🚨 [MediaWorker] Critical System Error:', err);
});
