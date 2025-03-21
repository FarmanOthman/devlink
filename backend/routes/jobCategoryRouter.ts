import express, { RequestHandler } from 'express';
import {
  createJobCategory,
  getJobCategories,
  getJobCategoryById,
  updateJobCategory,
  deleteJobCategory,
} from '../controllers/jobCategoryController';
import { authMiddleware } from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import { UserRole } from '../types';

const router = express.Router();

// Public routes - Anyone can view job categories
router.get('/job-categories', getJobCategories as RequestHandler);
router.get('/job-categories/:id', getJobCategoryById as RequestHandler);

// Protected routes
// POST /job-categories: Only Admins can create job categories
router.post('/job-categories', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.ADMIN]) as RequestHandler,
  createJobCategory as RequestHandler
);

// PUT /job-categories/:id: Only Admins can update job categories
router.put('/job-categories/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.ADMIN]) as RequestHandler,
  updateJobCategory as RequestHandler
);

// DELETE /job-categories/:id: Only Admins can delete job categories
router.delete('/job-categories/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.ADMIN]) as RequestHandler,
  deleteJobCategory as RequestHandler
);

export default router;
