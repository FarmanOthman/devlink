import express, { RequestHandler } from 'express';
import {
  getUsers,
  createUser,
  loginUser,
  updateUser,
  deleteUser,
} from '../controllers/userController';
import authMiddleware from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import { UserRole } from '../types';

const router = express.Router();

// CRUD Routes
router.get('/users', getUsers as RequestHandler);
router.post('/users', createUser as RequestHandler);
router.post('/login', loginUser as RequestHandler);
router.put('/users/:id', updateUser as RequestHandler);
router.delete('/users/:id', deleteUser as RequestHandler);

router.get('/admin', authMiddleware, authorizationMiddleware([UserRole.ADMIN]), (req, res) => {
    res.send('Welcome Admin');
});

export default router;