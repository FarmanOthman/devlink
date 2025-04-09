import express, { RequestHandler } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import ownershipCheck, { ResourceType } from '../middlewares/ownershipMiddleware';
import { UserRole } from '../types';
import {
  getInterviews,
  scheduleInterview,
  updateInterviewStatus,
  markApplicationUnderReview
} from '../controllers/modules/applicationController';

const router = express.Router();

// Get all interviews - Only admins and recruiters can see all interviews
router.get('/interviews', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.ADMIN, UserRole.RECRUITER]) as RequestHandler,
  getInterviews as RequestHandler
);

// Schedule an interview for an application - Only recruiters and admins
router.post('/applications/:id/interview', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  scheduleInterview as RequestHandler
);

// Update interview status - Both parties can update status
router.patch('/applications/:id/interview-status', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck(ResourceType.APPLICATION, true) as RequestHandler, // true = check both user and recruiter
  updateInterviewStatus as RequestHandler
);

// Mark application as under review - Only recruiters and admins
router.patch('/applications/:id/under-review',
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck(ResourceType.APPLICATION, false) as RequestHandler, // Only job creator/recruiter can mark under review
  markApplicationUnderReview as RequestHandler
);

export default router; 