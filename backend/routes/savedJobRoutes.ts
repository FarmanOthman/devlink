import express, { RequestHandler } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import ownershipCheck, { ResourceType } from '../middlewares/ownershipMiddleware';
import { UserRole } from '../types';
import {
  getSavedJobs,
  saveJob,
  unsaveJob,
  getSavedJobById,
  isJobSaved
} from '../controllers/modules/savedJobController';

const router = express.Router();

// Get all saved jobs for the authenticated user - only developers can view their saved jobs, admins can view all
router.get('/saved-jobs', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.ADMIN]) as RequestHandler,
  getSavedJobs as RequestHandler
);

// Check if a job is saved by the current user - only developers can check their saved jobs
router.get('/saved-jobs/check/:jobId', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER]) as RequestHandler,
  isJobSaved as RequestHandler
);

// Get a specific saved job - only developers can view their own saved jobs, admins can view any
router.get('/saved-jobs/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck(ResourceType.SAVED_JOB) as RequestHandler,
  getSavedJobById as RequestHandler
);

// Create a new saved job - only developers can save jobs
router.post('/saved-jobs', 
  authMiddleware as RequestHandler, 
  authorizationMiddleware([UserRole.DEVELOPER]) as RequestHandler,
  saveJob as RequestHandler
);

// Delete a saved job - only developers can delete their own saved jobs, admins can delete any
router.delete('/saved-jobs/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck(ResourceType.SAVED_JOB) as RequestHandler,
  unsaveJob as RequestHandler
);

export default router; 