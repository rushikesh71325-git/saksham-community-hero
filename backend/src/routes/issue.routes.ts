import { Router } from 'express';
import * as issueController from '../controllers/issue.controller';
import { verifyToken } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { Role } from '@prisma/client';
import { uploadMiddleware } from '../middleware/upload';

const router = Router();

// ==========================================
// CORE CRUD ROUTES
// ==========================================

// 1. Get list of issues (Community Feed)
// This is public so anyone can see the city's status.
router.get('/', issueController.getIssues);

// 2. Get a single issue by ID (Issue Details timeline)
router.get('/:id', issueController.getIssueById);

// 3. Create a new civic issue
// Requires a valid JWT. (Remember, anonymous users still get a JWT via their device fingerprint!)
// The uploadMiddleware intercepts the request and saves up to 4 'evidence' files to disk.
router.post('/', verifyToken, uploadMiddleware.array('images', 3), issueController.createIssue);

// 4. Track a public issue by ticketCode
router.get('/track/:ticketCode', issueController.trackIssue);


// ==========================================
// UPCOMING ROUTES (Placeholders for future phases)
// ==========================================

// Phase 8: Gamification
// HACKATHON: Removed auth requirements to allow easy testing of Gamification
router.post('/:id/upvote', issueController.upvoteIssue);
router.patch('/:id/verify', issueController.verifyIssueResolution);

// Phase 5: Field Resolution (Officer uploads proof photo)
// We will mock requireRole for now to allow easy testing, but we still verify token
router.post('/:id/resolve', uploadMiddleware.single('proof'), issueController.resolveIssue);
router.patch('/:id/acknowledge', issueController.acknowledgeIssue);

/*
// Phase 16: Admin / Officer Manual Override
router.patch('/:id/status', verifyToken, requireRole([Role.OFFICER, Role.WARD_ADMIN, Role.SUPER_ADMIN]), ...);
*/

export default router;
