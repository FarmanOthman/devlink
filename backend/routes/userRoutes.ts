import express, { RequestHandler } from 'express';
import {
  getUsers,
  createUser,
  loginUser,
  updateUser,
  deleteUser,
} from '../controllers/userController';

const router = express.Router();

// CRUD Routes
router.get('/users', getUsers as RequestHandler);
router.post('/users', createUser as RequestHandler);
router.post('/users/login', loginUser as RequestHandler);
router.put('/users/:id', updateUser as RequestHandler);
router.delete('/users/:id', deleteUser as RequestHandler);

export default router;