import express, { RequestHandler } from 'express';
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

// Get all users - accessible to all authenticated users
router.get('/users', 
  authMiddleware as RequestHandler, 
  getUsers as RequestHandler
);

// Get user by ID - accessible to all authenticated users
router.get('/users/:id', 
  authMiddleware as RequestHandler, 
  getUserById as RequestHandler
);

// Update user - users can only update their own data, admins can update any user
router.put('/users/:id', 
  authMiddleware as RequestHandler, 
  ownershipCheck(ResourceType.USER) as RequestHandler,
  updateUser as RequestHandler
);

// Delete user - users can only delete their own data, admins can delete any user
router.delete('/users/:id', 
  authMiddleware as RequestHandler, 
  ownershipCheck(ResourceType.USER) as RequestHandler,
  deleteUser as RequestHandler
);

// Update user role - admin only
router.patch('/users/:id/role', 
  authMiddleware as RequestHandler, 
  authorizationMiddleware([UserRole.ADMIN]) as RequestHandler,
  updateUserRole as RequestHandler
);

// Logout user
router.post('/logout', 
  authMiddleware as RequestHandler, 
  logout as RequestHandler
);

export default router;