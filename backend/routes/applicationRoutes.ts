import express, { RequestHandler } from 'express';
import {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
  getUserApplications
} from '../controllers/modules/applicationController';
import { authMiddleware } from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import ownershipCheck, { ResourceType } from '../middlewares/ownershipMiddleware';
import { UserRole } from '../types';

const router = express.Router();

// GET /applications/user/:userId: Developers can view their own applications
router.get('/applications/user/:userId', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck(ResourceType.USER) as RequestHandler,
  getUserApplications as RequestHandler
);

// GET /applications/:id: Developers can view their own applications. Recruiters and Admins can view any application
// Ownership middleware will check if recruiters own the job related to this application
router.get('/applications/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck(ResourceType.APPLICATION, true) as RequestHandler,
  getApplicationById as RequestHandler
);

// GET /applications: Only Recruiters and Admins can view all applications
// For recruiters, the ownership check in the controller will restrict to only their job applications
router.get('/applications', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  getApplications as RequestHandler
);

// POST /applications: Only Developers can apply for jobs
router.post('/applications', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER]) as RequestHandler,
  createApplication as RequestHandler
);

// PUT /applications/:id: Only Recruiters and Admins can update application status
// For recruiters, we need to check if they own the job related to this application
router.put('/applications/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck(ResourceType.APPLICATION, true) as RequestHandler,
  updateApplication as RequestHandler
);

// DELETE /applications/:id: Developers can delete their own applications. Recruiters and Admins can delete any application
router.delete('/applications/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck(ResourceType.APPLICATION, true) as RequestHandler,
  deleteApplication as RequestHandler
);

export default router;