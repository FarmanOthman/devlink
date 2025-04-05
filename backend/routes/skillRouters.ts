import express, { RequestHandler } from 'express';
import {
  createSkill,
  getSkills,
  getSkillById,
  updateSkill,
  deleteSkill,
} from '../controllers/modules/skillController';
import { authMiddleware } from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import { UserRole } from '../types';

const router = express.Router();

// Public routes
router.get('/skills', getSkills as RequestHandler);
router.get('/skills/:id', getSkillById as RequestHandler);

// Protected routes - Only Admins can modify skills
router.post('/skills', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.ADMIN]) as RequestHandler,
  createSkill as RequestHandler
);

router.put('/skills/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.ADMIN]) as RequestHandler,
  updateSkill as RequestHandler
);

router.delete('/skills/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.ADMIN]) as RequestHandler,
  deleteSkill as RequestHandler
);

export default router;
