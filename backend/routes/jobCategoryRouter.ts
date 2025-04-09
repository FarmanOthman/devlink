import express, { RequestHandler } from 'express';
import {
  createJobCategory,
  getJobCategories,
  getJobCategoryById,
  updateJobCategory,
  deleteJobCategory,
  getJobsByCategoryId
} from '../controllers/modules/jobCategoryController';
import { authMiddleware } from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import { UserRole } from '../types';

const router = express.Router();

// Public routes - Anyone can view job categories
router.get('/job-categories', getJobCategories as RequestHandler);
router.get('/job-categories/:id', getJobCategoryById as RequestHandler);
router.get('/job-categories/:id/jobs', getJobsByCategoryId as RequestHandler);

// Protected routes - Only Admins can modify job categories
router.post('/job-categories', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.ADMIN]) as RequestHandler,
  createJobCategory as RequestHandler
);

router.put('/job-categories/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.ADMIN]) as RequestHandler,
  updateJobCategory as RequestHandler
);

router.delete('/job-categories/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.ADMIN]) as RequestHandler,
  deleteJobCategory as RequestHandler
);

export default router;
