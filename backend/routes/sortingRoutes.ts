import express, { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import {
  getSortedJobs,
  getSortedApplications,
  getRecommendedJobs,
  getRecommendedCandidates
} from '../controllers/sorting';

const router: Router = express.Router();

// Routes for job sorting and recommendations
router.get('/jobs', authenticateToken, getSortedJobs);
router.get('/jobs/recommended', authenticateToken, getRecommendedJobs);

// Routes for application sorting and candidate recommendations
router.get('/applications/:jobId', authenticateToken, getSortedApplications);
router.get('/candidates/:jobId', authenticateToken, getRecommendedCandidates);

export default router; 