import express, { RequestHandler } from 'express';
import {
  createSkill,
  getSkills,
  getSkillById,
  updateSkill,
  deleteSkill,
} from '../controllers/skillContoller';
import authMiddleware from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import { UserRole } from '../types';

const router = express.Router();

// Public routes
router.get('/skills', getSkills as RequestHandler);
router.get('/skills/:id', getSkillById as RequestHandler);

// Protected routes - Admin only 
router.post('/skills', 
  authMiddleware,
  authorizationMiddleware([UserRole.ADMIN]),
  createSkill as RequestHandler
);

router.put('/skills/:id', 
  authMiddleware,
  authorizationMiddleware([UserRole.ADMIN]),
  updateSkill as RequestHandler
);

router.delete('/skills/:id', 
  authMiddleware,
  authorizationMiddleware([UserRole.ADMIN]),
  deleteSkill as RequestHandler
);

export default router;
