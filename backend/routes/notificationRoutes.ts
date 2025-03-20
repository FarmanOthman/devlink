import express, { RequestHandler } from 'express';
import {
  createNotification,
  getNotifications,
  getNotificationById,
  markNotificationAsRead,
  deleteNotification
} from '../controllers/notificationController';
import authMiddleware from '../middlewares/authMiddleware';

const router = express.Router();

// All notification routes should be protected as they relate to user data
router.post('/notifications', authMiddleware, createNotification as RequestHandler);
router.get('/notifications/:userId', authMiddleware, getNotifications as RequestHandler);
router.get('/notifications/detail/:id', authMiddleware, getNotificationById as RequestHandler);
router.put('/notifications/:id/read', authMiddleware, markNotificationAsRead as RequestHandler);
router.delete('/notifications/:id', authMiddleware, deleteNotification as RequestHandler);

export default router;
