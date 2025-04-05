import express, { RequestHandler, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express.d';
import { authMiddleware } from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import ownershipCheck, { ResourceType } from '../middlewares/ownershipMiddleware';
import { UserRole } from '../types';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole,
  logout,
  loginUser,
  createUser
} from '../controllers/modules/userController';

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', createUser as RequestHandler);
router.post('/login', loginUser as RequestHandler);

// Protected routes
router.get('/users', 
  authMiddleware as RequestHandler,
  (getUsers as unknown) as RequestHandler
);

router.get('/users/:id', 
  authMiddleware as RequestHandler,
  (getUserById as unknown) as RequestHandler
);

router.put('/users/:id', 
  authMiddleware as RequestHandler,
  ownershipCheck(ResourceType.USER) as RequestHandler,
  (updateUser as unknown) as RequestHandler
);

router.delete('/users/:id', 
  authMiddleware as RequestHandler,
  ownershipCheck(ResourceType.USER) as RequestHandler,
  (deleteUser as unknown) as RequestHandler
);

router.patch('/users/:id/role', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.ADMIN]) as RequestHandler,
  (updateUserRole as unknown) as RequestHandler
);

router.post('/logout', 
  authMiddleware as RequestHandler,
  (logout as unknown) as RequestHandler
);

export default router;