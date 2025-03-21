import express, { RequestHandler } from 'express';
import {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
  getUserApplications
} from '../controllers/applicationController';
import { authMiddleware } from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import ownershipCheck from '../middlewares/ownershipMiddleware';
import { UserRole } from '../types';

const router = express.Router();

// GET /applications: Only Recruiters and Admins can view all applications
router.get('/applications', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  getApplications as RequestHandler
);

// GET /applications/:id: Developers can view their own applications. Recruiters and Admins can view any application
router.get('/applications/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck('application') as RequestHandler,
  getApplicationById as RequestHandler
);

// GET /applications/user/:userId: Developers can view their own applications
router.get('/applications/user/:userId', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck('user') as RequestHandler,
  getUserApplications as RequestHandler
);

// POST /applications: Only Developers can apply for jobs
router.post('/applications', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER]) as RequestHandler,
  createApplication as RequestHandler
);

// PUT /applications/:id: Only Recruiters and Admins can update application status
router.put('/applications/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  updateApplication as RequestHandler
);

// DELETE /applications/:id: Developers can delete their own applications. Recruiters and Admins can delete any application
router.delete('/applications/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck('application') as RequestHandler,
  deleteApplication as RequestHandler
);

export default router;