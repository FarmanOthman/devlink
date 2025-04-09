import express, { RequestHandler } from 'express';
import {
  createJobSkill,
  getJobSkills,
  getJobSkillById,
  updateJobSkill,
  deleteJobSkill,
} from '../controllers/modules/jobSkillController';
import { authMiddleware } from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import ownershipCheck from '../middlewares/ownershipMiddleware';
import { UserRole } from '../types';

const router = express.Router();

// Public routes - Anyone can view job skills
router.get('/job-skills', getJobSkills as RequestHandler);
router.get('/job-skills/:id', getJobSkillById as RequestHandler);

// Protected routes
// POST /job-skills: Only Recruiters and Admins can create job skills
router.post('/job-skills', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  createJobSkill as RequestHandler
);

// PUT /job-skills/:id: Recruiters can update job skills they created. Admins can update any job skill
router.put('/job-skills/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck('job') as RequestHandler,
  updateJobSkill as RequestHandler
);

// DELETE /job-skills/:id: Recruiters can delete job skills they created. Admins can delete any job skill
router.delete('/job-skills/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck('job') as RequestHandler,
  deleteJobSkill as RequestHandler
);

export default router;
