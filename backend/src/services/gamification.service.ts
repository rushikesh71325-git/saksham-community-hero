import { PrismaClient, BadgeType } from '@prisma/client';
import { io } from '../config/socket';

const prisma = new PrismaClient();

// Configuration for our Gamification Engine
export const XP_REWARDS = {
  ISSUE_REPORTED: 10,
  ISSUE_UPVOTED: 2,
  ISSUE_RESOLVED: 50,
  PROOF_PROVIDED: 20,
};

// Thresholds for Leveling Up
const LEVEL_THRESHOLDS = [
  { level: 1, xpRequired: 0 },
  { level: 2, xpRequired: 50 },
  { level: 3, xpRequired: 150 },
  { level: 4, xpRequired: 300 },
  { level: 5, xpRequired: 600 },
  { level: 10, xpRequired: 5000 }, // Max Level "Community Hero"
];

/**
 * Step 8.1: Gamification Service
 * This engine calculates XP logic, handles Level Ups, and assigns badges.
 */
export const gamificationService = {
  /**
   * Awards XP to a citizen and checks for level ups
   */
  async awardXP(userId: string, action: keyof typeof XP_REWARDS): Promise<void> {
    try {
      const xpGained = XP_REWARDS[action];
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, xp: true, level: true },
      });

      // If the report was anonymous, there is no userId, so no XP is awarded!
      if (!user) return; 

      const newXP = user.xp + xpGained;
      
      // Calculate the new level based on thresholds
      let newLevel = 1;
      for (const threshold of LEVEL_THRESHOLDS) {
        if (newXP >= threshold.xpRequired) {
          newLevel = threshold.level;
        }
      }

      const leveledUp = newLevel > user.level;

      // Update the user in PostgreSQL
      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: newXP,
          level: newLevel,
        },
      });

      // Push a real-time WebSocket notification directly to the user's phone!
      io.to(`user:${userId}`).emit('notification', {
        type: 'XP_GAINED',
        title: `+${xpGained} XP!`,
        message: `You earned XP for: ${action.replace('_', ' ')}`,
        xpGained,
        newTotal: newXP,
      });

      // Did they level up?
      if (leveledUp) {
        io.to(`user:${userId}`).emit('notification', {
          type: 'LEVEL_UP',
          title: `Level Up!`,
          message: `Congratulations! You are now Level ${newLevel}!`,
          newLevel,
        });
        
        // Let's also award a shiny badge if they hit Level 5!
        if (newLevel === 5) {
          await this.awardBadge(userId, BadgeType.CIVIC_CHAMPION);
        }
      }

      console.log(`🎮 [Gamification] User ${userId} gained ${xpGained} XP (Total: ${newXP}, Level: ${newLevel})`);
      
    } catch (error) {
      console.error(`❌ [Gamification] Failed to award XP:`, error);
    }
  },

  /**
   * Awards a unique badge to a citizen
   */
  async awardBadge(userId: string, type: BadgeType): Promise<void> {
    try {
      // Check if they already have this badge to avoid duplicates
      const existingBadge = await prisma.badge.findFirst({
        where: { userId, type }
      });

      if (existingBadge) return;

      // Insert the badge into PostgreSQL
      await prisma.badge.create({
        data: {
          userId,
          type
        }
      });

      // Push real-time notification
      io.to(`user:${userId}`).emit('notification', {
        type: 'BADGE_UNLOCKED',
        title: `New Badge Unlocked!`,
        message: `You earned the ${type} badge!`,
        badgeType: type
      });

      console.log(`🏅 [Gamification] User ${userId} unlocked Badge: ${type}`);
    } catch (error) {
      console.error(`❌ [Gamification] Failed to award Badge:`, error);
    }
  }
};
