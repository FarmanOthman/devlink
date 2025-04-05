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
  createUser,
  forgotPassword,
  resetPassword
} from '../controllers/modules/userController';

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', createUser as RequestHandler);
router.post('/login', loginUser as RequestHandler);
router.post('/forgot-password', forgotPassword as RequestHandler);
router.post('/reset-password', resetPassword as RequestHandler);

// Protected routes (authentication required)
router.use(authMiddleware as RequestHandler);

router.get('/users', authorizationMiddleware([UserRole.ADMIN]), getUsers as RequestHandler);
router.get('/users/:id', getUserById as RequestHandler);
router.put('/users/:id', ownershipCheck(ResourceType.USER), updateUser as unknown as RequestHandler);
router.delete('/users/:id', ownershipCheck(ResourceType.USER), deleteUser as RequestHandler);
router.put('/users/:id/role', authorizationMiddleware([UserRole.ADMIN]), updateUserRole as RequestHandler);
router.post('/logout', logout as RequestHandler);

export default router;