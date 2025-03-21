import express, { RequestHandler } from 'express';
import {
  getUsers,
  createUser,
  loginUser,
  updateUser,
  deleteUser,
  getUserById,
  updateUserRole,
  logoutUser
} from '../controllers/userController';
import authMiddleware from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import ownershipCheck from '../middlewares/ownershipMiddleware';
import { UserRole } from '../types';

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', createUser as RequestHandler);
router.post('/login', loginUser as RequestHandler);

// Protected routes (require authentication)
router.use(authMiddleware as RequestHandler); // Apply authentication to all routes below

// Routes that require authentication
router.post('/logout', logoutUser as RequestHandler);

// Admin only routes
router.get('/users',
  authorizationMiddleware([UserRole.ADMIN]) as RequestHandler,
  getUsers as RequestHandler
);

router.patch('/users/:id/role',
  authorizationMiddleware([UserRole.ADMIN]) as RequestHandler,
  updateUserRole as RequestHandler
);

// User specific routes (require ownership or admin)
router.get('/users/:id',
  ownershipCheck('user'),
  getUserById as RequestHandler
);

router.put('/users/:id',
  ownershipCheck('user'),
  updateUser as RequestHandler
);

router.delete('/users/:id',
  ownershipCheck('user'),
  deleteUser as RequestHandler
);

export default router;