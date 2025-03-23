import express, { RequestHandler } from 'express';
import {
  createUserSkill,
  getUserSkills,
  getUserSkillById,
  updateUserSkill,
  deleteUserSkill,
  getUserSkillsByUserId
} from '../controllers/modules/userSkillController';
import { authMiddleware } from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import ownershipCheck from '../middlewares/ownershipMiddleware';
import { UserRole } from '../types';

const router = express.Router();

// GET /user-skills: Developers and Recruiters can view their own skills. Admins can view all user skills.
router.get('/user-skills', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.ADMIN]) as RequestHandler,
  getUserSkills as RequestHandler
);

// GET /user-skills/user/:userId: Developers and Recruiters can view their own skills
router.get('/user-skills/user/:userId', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck('user') as RequestHandler,
  getUserSkillsByUserId as RequestHandler
);

// GET /user-skills/:id: Developers and Recruiters can view their own skills. Admins can view any user skill.
router.get('/user-skills/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck('userSkill') as RequestHandler,
  getUserSkillById as RequestHandler
);

// POST /user-skills: Only Developers and Admins can add skills to a user.
router.post('/user-skills', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.ADMIN]) as RequestHandler,
  createUserSkill as RequestHandler
);

// PUT /user-skills/:id: Developers can update their own skills. Admins can update any user skill.
router.put('/user-skills/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck('userSkill') as RequestHandler,
  updateUserSkill as RequestHandler
);

// DELETE /user-skills/:id: Developers can delete their own skills. Admins can delete any user skill.
router.delete('/user-skills/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck('userSkill') as RequestHandler,
  deleteUserSkill as RequestHandler
);

export default router;
