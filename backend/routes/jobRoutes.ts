import express, { RequestHandler } from 'express';
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob
} from '../controllers/modules/jobController';
import { authMiddleware } from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import ownershipCheck, { ResourceType } from '../middlewares/ownershipMiddleware';
import { UserRole } from '../types';

const router = express.Router();

// Public routes - Anyone can view jobs
router.get('/jobs', getJobs as RequestHandler);
router.get('/jobs/:id', getJobById as RequestHandler);

// Protected routes
// POST /jobs: Only Recruiters and Admins can create jobs
router.post('/jobs', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  createJob as RequestHandler
);

// PUT /jobs/:id: Recruiters can update jobs they created. Admins can update any job
router.put('/jobs/:id', 
  authMiddleware as RequestHandler,
  ownershipCheck(ResourceType.JOB) as RequestHandler,
  updateJob as RequestHandler
);

// DELETE /jobs/:id: Recruiters can delete jobs they created. Admins can delete any job
router.delete('/jobs/:id', 
  authMiddleware as RequestHandler,
  ownershipCheck(ResourceType.JOB) as RequestHandler,
  deleteJob as RequestHandler
);

export default router;