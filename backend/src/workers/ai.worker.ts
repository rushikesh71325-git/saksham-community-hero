import { Worker, Job } from 'bullmq';
import { PrismaClient, ActorType } from '@prisma/client';
import { redisClient } from '../config/redis';
import { QUEUE_NAMES } from '../services/queue.service';
import { classifyIssueWithAI } from '../utils/gemini';

const prisma = new PrismaClient();

/**
 * Step 5.2: The AI Worker
 * This background process listens to the AI_CLASSIFY queue. 
 * Whenever a new issue is submitted, this worker picks it up, 
 * passes the text to Google Gemini, and saves the classification to the database.
 */
export const aiWorker = new Worker(
  QUEUE_NAMES.AI_CLASSIFY,
  async (job: Job) => {
    // 1. Extract the data passed from the Issue Controller (Step 3.2)
    const { issueId, description } = job.data as { issueId: string, description: string };
    
    console.log(`🤖 [AIWorker] Analyzing Issue: ${issueId}`);

    try {
      // 2. Ask Gemini to classify the issue (Takes < 1 second usually)
      const aiResult = await classifyIssueWithAI(description);

      // 3. Update the Issue in PostgreSQL with the AI's findings
      await prisma.issue.update({
        where: { id: issueId },
        data: {
          category: aiResult.category,
          severity: aiResult.severity,
          aiConfidence: aiResult.confidence,
          aiRaw: aiResult.rawOutput, // Save the raw JSON for debugging
          aiProcessedAt: new Date(),
        }
      });

      // 4. Log this action in our immutable event ledger
      // Notice how we use `ActorType.AI`. This means when the citizen looks at the timeline,
      // they literally see "System AI classified this issue as CRITICAL"
      await prisma.issueEvent.create({
        data: {
          issueId: issueId,
          eventType: 'AI_CLASSIFIED',
          actorType: ActorType.AI,
          newValue: {
            category: aiResult.category,
            severity: aiResult.severity,
            confidence: aiResult.confidence,
            reasoning: aiResult.reasoning // The 1-sentence explanation from Gemini
          }
        }
      });

      console.log(`✅ [AIWorker] Issue ${issueId} classified as [${aiResult.severity}] ${aiResult.category}`);
      
    } catch (error) {
      console.error(`❌ [AIWorker] Failed to analyze Issue: ${issueId}`, error);
      // Throwing the error triggers BullMQ's automatic exponential backoff retry logic!
      throw error; 
    }
  },
  {
    connection: redisClient as any,
    // We set concurrency lower than the Media worker because 
    // AI APIs often have stricter rate limits (e.g., requests per minute).
    concurrency: 2 
  }
);

// Global error listener
aiWorker.on('error', (err) => {
  console.error('🚨 [AIWorker] Critical System Error:', err);
});
