import express, { Router, RequestHandler } from 'express';
import { authMiddleware as authenticateToken } from '../middlewares/authMiddleware';
import {
  getSortedJobs,
  getSortedApplications,
  getRecommendedJobs,
  getRecommendedCandidates
} from '../controllers/sorting';

const router: Router = express.Router();

// Routes for job sorting and recommendations
router.get('/jobs', authenticateToken as RequestHandler, getSortedJobs as unknown as RequestHandler);
router.get('/jobs/recommended', authenticateToken as RequestHandler, getRecommendedJobs as unknown as RequestHandler);

// Routes for application sorting and candidate recommendations
router.get('/applications/:jobId', authenticateToken as RequestHandler, getSortedApplications as unknown as RequestHandler);
router.get('/candidates/:jobId', authenticateToken as RequestHandler, getRecommendedCandidates as unknown as RequestHandler);

export default router; 