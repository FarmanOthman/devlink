import express, { RequestHandler } from 'express';
import {
  getUsers,
  createUser,
  loginUser,
  updateUser,
  deleteUser,
  getUserById,
  updateUserRole
} from '../controllers/userController';
import authMiddleware from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import ownershipCheck from '../middlewares/ownershipMiddleware';
import { UserRole } from '../types';

const router = express.Router();

// Public routes
router.post('/users', createUser as RequestHandler); // Anyone can register
router.post('/login', loginUser as RequestHandler); // Anyone can login

// Protected routes
// GET /users: Only Admins can view all users
router.get('/users',
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.ADMIN]) as RequestHandler,
  getUsers as RequestHandler
);

// GET /users/:id: Developers and Recruiters can view their own profiles. Admins can view any profile
router.get('/users/:id',
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck('user') as RequestHandler,
  getUserById as RequestHandler
);

// PUT /users/:id: Developers and Recruiters can update their own profiles. Admins can update any profile
router.put('/users/:id',
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck('user') as RequestHandler,
  updateUser as RequestHandler
);

// DELETE /users/:id: Only Admins can delete users
router.delete('/users/:id',
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.ADMIN]) as RequestHandler,
  deleteUser as RequestHandler
);

// PUT /users/:id/role: Only Admins can change user roles
router.put('/users/:id/role',
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.ADMIN]) as RequestHandler,
  updateUserRole as RequestHandler
);

export default router;