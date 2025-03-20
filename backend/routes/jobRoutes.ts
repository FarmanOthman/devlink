import express from 'express';
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
} from '../controllers/jobController';
import authMiddleware from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import { UserRole } from '../types';

const router = express.Router();

// Public routes
router.get('/jobs', getJobs);
router.get('/jobs/:id', getJobById);

// Protected routes (Recruiter only)
router.post('/jobs', 
    authMiddleware,
    authorizationMiddleware([UserRole.RECRUITER, UserRole.ADMIN]),
    createJob
);

router.put('/jobs/:id', 
    authMiddleware,
    authorizationMiddleware([UserRole.RECRUITER, UserRole.ADMIN]),
    updateJob
);

router.delete('/jobs/:id', 
    authMiddleware,
    authorizationMiddleware([UserRole.RECRUITER, UserRole.ADMIN]),
    deleteJob
);

export default router;