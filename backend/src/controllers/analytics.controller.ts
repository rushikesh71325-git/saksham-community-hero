import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAnalyticsOverview = async (req: Request, res: Response) => {
  try {
    // 1. Issue Category Breakdown
    const issues = await prisma.issue.findMany({
      select: { category: true, status: true }
    });

    const categoryMap: Record<string, number> = {};
    let resolvedCount = 0;
    
    issues.forEach(issue => {
      const cat = issue.category || 'Uncategorized';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
      if (issue.status === 'RESOLVED' || issue.status === 'CLOSED_VERIFIED' || issue.status === 'CLOSED_AUTO') {
        resolvedCount++;
      }
    });

    const categoryBreakdown = Object.keys(categoryMap).map(key => ({
      name: key,
      value: categoryMap[key]
    }));

    // 2. Real Ward Performance Scores (based on issue count vs resolved count per corporation)
    const corporations = await prisma.corporation.findMany({
      select: { id: true, name: true, issues: { select: { status: true } } }
    });
    
    const performanceScores = corporations.map(c => {
      const total = c.issues.length;
      let resolved = 0;
      c.issues.forEach(issue => {
        if (issue.status === 'RESOLVED' || issue.status === 'CLOSED_VERIFIED' || issue.status === 'CLOSED_AUTO') resolved++;
      });
      // Score is a mix of baseline (50) + resolution rate
      let score = 50; 
      if (total > 0) {
        score += Math.round((resolved / total) * 50);
      } else {
        score = 0; // No issues yet
      }

      return {
        name: c.name.replace(' Municipal Corporation', '').replace('Mahanagara Palike', '').trim(),
        score: score
      };
    }).filter(c => c.score > 0).sort((a, b) => b.score - a.score); // Only show active corps

    // 3. Real Top XP Earners Leaderboard
    const topUsers = await prisma.user.findMany({
      orderBy: { xp: 'desc' },
      take: 5,
      select: { displayName: true, xp: true, badges: true }
    });

    const topEarners = topUsers.map(user => ({
      name: user.displayName || 'Anonymous Hero',
      xp: user.xp,
      badges: user.badges ? user.badges.length : Math.floor(user.xp / 100)
    }));

    return res.status(200).json({
      data: {
        stats: {
          totalIssues: issues.length,
          resolvedIssues: resolvedCount,
          resolutionRate: issues.length ? Math.round((resolvedCount / issues.length) * 100) : 0
        },
        categoryBreakdown,
        performanceScores,
        topEarners
      }
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};
