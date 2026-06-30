import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { mediaQueue, aiQueue, gisQueue } from '../services/queue.service';
import { gamificationService } from '../services/gamification.service';

const prisma = new PrismaClient();

/**
 * Helper to generate a human-readable ticket code (e.g. CH-2024-X8B9Q)
 */
const generateTicketCode = () => {
  const year = new Date().getFullYear();
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `CH-${year}-${randomStr}`;
};

/**
 * Step 3.2: Create Issue
 * This is the primary entry point for citizens reporting problems.
 * It immediately saves the core data and offloads heavy lifting to queues.
 */
export const createIssue = async (req: Request, res: Response) => {
  try {
    const { title, description, latitude, longitude, isAnonymous } = req.body;
    
    // Extract uploaded files from Multer
    const files = req.files as Express.Multer.File[];
    const imageUrls = files ? files.map(file => `/uploads/${file.filename}`) : [];
    const filePaths = files ? files.map(file => file.path) : [];
    
    // 1. Create the issue in the database (Status defaults to PENDING)
    const issue = await prisma.issue.create({
      data: {
        ticketCode: generateTicketCode(),
        title: title || null,
        description,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        isAnonymous: isAnonymous === 'true' || isAnonymous === true,
        // If the user is logged in, attach their ID
        reporterId: req.user?.id || null, 
        imageUrls,
      }
    });

    // 2. Log the creation in our immutable event ledger
    await prisma.issueEvent.create({
      data: {
        issueId: issue.id,
        eventType: 'ISSUE_CREATED',
        actorType: req.user ? 'CITIZEN' : 'SYSTEM',
        actorId: req.user?.id || null,
        newValue: { status: issue.status }
      }
    });

    // 3. Drop jobs into our asynchronous BullMQ queues (The MeraWard Event Bus pattern)
    
    // If they uploaded images, send the local file paths to the media processor
    if (filePaths.length > 0) {
      await mediaQueue.add('process_images', { issueId: issue.id, filePaths });
    }

    // Always send to AI for classification (category & severity)
    await aiQueue.add('classify_issue', { issueId: issue.id, description });

    // Always send to GIS for ward routing based on GPS coordinates
    await gisQueue.add('resolve_ward', { issueId: issue.id, latitude, longitude });

    // 4. Award XP for reporting an issue (Gamification Phase 8)
    const userId = req.user?.id || 'mock-citizen-uuid-for-demo';
    // We explicitly do NOT 'await' this. Gamification runs completely in the background 
    // so it never slows down the citizen's UI experience!
    gamificationService.awardXP(userId, 'ISSUE_REPORTED').catch(e => 
      console.error('Failed to award XP in background:', e)
    );

    // 5. Return immediately to the user (Fast <500ms response!)
    return res.status(202).json({
      message: 'Issue submitted successfully and is being processed.',
      ticketCode: issue.ticketCode,
      issueId: issue.id
    });

  } catch (error) {
    console.error('Error creating issue:', error);
    return res.status(500).json({ error: 'Failed to submit issue' });
  }
};

/**
 * Step 3.3: Get Issues (List with filters + pagination)
 * Allows citizens to view the community feed, and admins to filter 
 * issues by ward, status, category, etc.
 */
export const getIssues = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', wardId, category, status, severity, lat, lng, radius } = req.query;
    
    // Calculate pagination offsets
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build the dynamic Prisma 'where' clause based on provided query parameters
    const whereClause: any = {};
    if (wardId) whereClause.wardId = wardId;
    if (category) whereClause.category = category;
    if (status) whereClause.status = status;
    if (severity) whereClause.severity = severity;

    // Fast bounding-box geospatial query using standard PostgreSQL indexes
    if (lat && lng) {
      const latNum = parseFloat(lat as string);
      const lngNum = parseFloat(lng as string);
      const radNum = parseFloat(radius as string) || 20; // default 20km
      
      // 1 degree of latitude is roughly 111km. 
      // Longitude varies based on latitude (cosine math).
      const latDelta = radNum / 111;
      const lngDelta = radNum / (111 * Math.cos(latNum * (Math.PI / 180)));
      
      whereClause.latitude = { gte: latNum - latDelta, lte: latNum + latDelta };
      whereClause.longitude = { gte: lngNum - lngDelta, lte: lngNum + lngDelta };
    }

    // Fetch the total count so the frontend can build page numbers
    const totalCount = await prisma.issue.count({ where: whereClause });

    // Fetch the actual data, including a small subset of relation data
    const issues = await prisma.issue.findMany({
      where: whereClause,
      skip,
      take: limitNum,
      orderBy: { submittedAt: 'desc' }, // Show newest issues first
      include: {
        reporter: {
          select: { id: true, displayName: true, avatarUrl: true }
        },
        ward: {
          select: { id: true, wardName: true }
        }
      }
    });

    return res.status(200).json({
      meta: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
      },
      data: issues
    });

  } catch (error) {
    console.error('Error fetching issues:', error);
    return res.status(500).json({ error: 'Failed to fetch issues' });
  }
};

/**
 * Step 3.4: Get Issue By ID (with full timeline)
 * Used on the Issue Details page to show the complete history of a complaint,
 * including who changed the status and when.
 */
export const getIssueById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        reporter: {
          select: { id: true, displayName: true, avatarUrl: true }
        },
        ward: {
          select: { id: true, wardName: true }
        },
        assignedOfficer: {
          select: { id: true, displayName: true, avatarUrl: true }
        },
        // Fetch the entire audit log, newest first
        events: {
          orderBy: { occurredAt: 'desc' },
          include: {
            actor: { select: { id: true, displayName: true, role: true } }
          }
        },
        upvotes: {
          // Optimization: If the user is logged in, only fetch THEIR upvote
          where: { userId: req.user?.id || 'unauthenticated' },
          select: { id: true }
        }
      }
    });

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Add a simple boolean flag so the frontend knows whether to highlight the Upvote button
    const hasUpvoted = issue.upvotes.length > 0;

    return res.status(200).json({ 
      data: {
        ...issue,
        hasUpvoted,
        upvotes: undefined // Remove the array from the payload to keep it clean
      } 
    });

  } catch (error) {
    console.error('Error fetching issue by ID:', error);
    return res.status(500).json({ error: 'Failed to fetch issue details' });
  }
};

/**
 * Step 8.3: Upvote an Issue (Gamification)
 * When a citizen upvotes a problem:
 * 1. The issue gets +1 upvote so it trends on the community feed
 * 2. The original reporter gets +2 XP for bringing it to the city's attention!
 */
export const upvoteIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // HACKATHON: Default to a mock user ID if not logged in to test Gamification
    const userId = req.user?.id || 'mock-citizen-uuid-for-demo';

    // 1. Prevent double voting using Prisma's unique compound index
    // Note: In demo mode, all anonymous users share the same mock ID, so they can only upvote once.
    // If we want unlimited testing, we can use a random uuid or skip the check.
    // For now, let's skip the existingUpvote check if it's the mock user so we can test the 10 upvote threshold easily.
    if (userId !== 'mock-citizen-uuid-for-demo') {
      const existingUpvote = await prisma.upvote.findUnique({
        where: {
          issueId_userId: { issueId: id, userId: userId }
        }
      });
      if (existingUpvote) return res.status(400).json({ error: 'You have already upvoted this issue' });
    }

    // 2. Fetch the issue to find out who the original reporter is and current upvote count
    const issue = await prisma.issue.findUnique({
      where: { id },
      select: { reporterId: true, upvoteCount: true, severity: true }
    });

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // 3. Database Transaction (If one fails, both fail)
    const newUpvoteCount = issue.upvoteCount + 1;
    const shouldEscalate = newUpvoteCount >= 10 && issue.severity !== 'CRITICAL';
    
    await prisma.$transaction(async (tx) => {
      // Create a unique user id for the demo to bypass the unique constraint
      const mockUserId = userId === 'mock-citizen-uuid-for-demo' ? `mock-${Math.random()}` : userId;
      await tx.upvote.create({ data: { issueId: id, userId: mockUserId } });
      await tx.issue.update({
        where: { id },
        data: { 
          upvoteCount: { increment: 1 },
          ...(shouldEscalate && { severity: 'CRITICAL' })
        }
      });
    });

    if (shouldEscalate) {
      await prisma.issueEvent.create({
        data: {
          issueId: id,
          eventType: 'SEVERITY_ESCALATED',
          actorType: 'SYSTEM',
          newValue: { reason: 'Community Upvote Threshold Reached', severity: 'CRITICAL' }
        }
      });
      console.log(`🚀 Issue ${id} escalated to CRITICAL due to community upvotes!`);
    }

    // 4. Award +2 Gamification XP to the reporter! (Fire and forget)
    if (issue.reporterId) {
      gamificationService.awardXP(issue.reporterId, 'ISSUE_UPVOTED').catch(e => 
        console.error('Failed to award upvote XP:', e)
      );
    }

    return res.status(200).json({ message: 'Upvoted successfully!' });
  } catch (error) {
    console.error('Error upvoting issue:', error);
    return res.status(500).json({ error: 'Failed to upvote issue' });
  }
};

/**
 * Step 8.4: Citizen Verification (Gamification)
 * When a Civic Officer marks a ticket as "RESOLVED", the citizen gets a push notification.
 * If the citizen clicks "Yes, it's actually fixed", two things happen:
 * 1. The issue officially becomes "CLOSED_VERIFIED"
 * 2. The citizen earns a massive +50 XP for seeing the process through!
 */
export const verifyIssueResolution = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { citizenRating, citizenFeedback } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'You must be logged in to verify an issue' });
    }

    const issue = await prisma.issue.findUnique({
      where: { id },
      select: { reporterId: true, status: true }
    });

    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    
    // Only the person who created the ticket is allowed to verify if it was fixed
    if (issue.reporterId !== userId) {
      return res.status(403).json({ error: 'Only the original reporter can verify this issue' });
    }
    
    // We only allow verification if the officer has actually marked it as RESOLVED
    if (issue.status !== 'RESOLVED') {
      return res.status(400).json({ error: 'Issue must be marked as RESOLVED by an officer first' });
    }

    // 1. Update the database
    await prisma.issue.update({
      where: { id },
      data: {
        status: 'CLOSED_VERIFIED',
        citizenVerified: true,
        citizenRating: citizenRating || null,
        citizenFeedback: citizenFeedback || null,
        closedAt: new Date(),
      }
    });

    // 2. Log the action in our immutable event ledger
    await prisma.issueEvent.create({
      data: {
        issueId: id,
        eventType: 'CITIZEN_VERIFIED',
        actorType: 'CITIZEN',
        actorId: userId,
        newValue: { status: 'CLOSED_VERIFIED', rating: citizenRating }
      }
    });

    // 3. Award the massive 50 XP reward! (Fire and forget)
    gamificationService.awardXP(userId, 'ISSUE_RESOLVED').catch(e => 
      console.error('Failed to award verification XP:', e)
    );

    return res.status(200).json({ message: 'Thank you for keeping your city clean! +50 XP awarded!' });
  } catch (error) {
    console.error('Error verifying issue:', error);
    return res.status(500).json({ error: 'Failed to verify issue resolution' });
  }
};

export const acknowledgeIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Update status to IN_PROGRESS
    const issue = await prisma.issue.update({
      where: { id },
      data: { status: 'IN_PROGRESS' }
    });

    // Log the event
    await prisma.issueEvent.create({
      data: {
        issueId: id,
        eventType: 'STATUS_CHANGED',
        actorType: 'OFFICER',
        newValue: { status: 'IN_PROGRESS', note: 'Issue acknowledged by authorities' }
      }
    });

    return res.status(200).json({ message: 'Issue acknowledged', data: issue });
  } catch (error) {
    console.error('Error acknowledging issue:', error);
    return res.status(500).json({ error: 'Failed to acknowledge issue' });
  }
};

// ==========================================
// PHASE 5: COMMAND CENTER RESOLUTION & TRACKING
// ==========================================

export const trackIssue = async (req: Request, res: Response) => {
  try {
    const { ticketCode } = req.params;
    const issue = await prisma.issue.findUnique({
      where: { ticketCode },
      include: {
        ward: true,
        events: {
          orderBy: { occurredAt: 'desc' }
        }
      }
    });

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found with that tracking ID' });
    }

    return res.status(200).json({ data: issue });
  } catch (error) {
    console.error('Error tracking issue:', error);
    return res.status(500).json({ error: 'Failed to track issue' });
  }
};

export const resolveIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { resolutionNote } = req.body;
    const userId = req.user?.id; // The logged in official (mocked or real)
    const file = req.file;

    if (!resolutionNote) {
      return res.status(400).json({ error: 'Resolution note is required' });
    }

    if (!file) {
      return res.status(400).json({ error: 'After photo (proof) is required' });
    }

    // Process uploaded proof image
    const proofUrl = `/uploads/${file.filename}`;

    // 1. Update Issue to RESOLVED
    const updatedIssue = await prisma.issue.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        proofImageUrls: [proofUrl],
        resolvedAt: new Date(),
      }
    });

    // 2. Add an IssueEvent capturing the resolution note
    await prisma.issueEvent.create({
      data: {
        issueId: id,
        eventType: 'RESOLVED',
        actorType: 'OFFICER',
        actorId: userId,
        newValue: { note: resolutionNote, proofUrl }
      }
    });

    return res.status(200).json({ message: 'Issue resolved successfully', data: updatedIssue });
  } catch (error) {
    console.error('Error resolving issue:', error);
    return res.status(500).json({ error: 'Failed to resolve issue' });
  }
};
