import express from 'express';
import {
  createNotification,
  getNotifications,
  getNotificationById,
  markNotificationAsRead,
  deleteNotification,
} from '../controllers/notificationController';

const router = express.Router();

// CRUD Routes for Notification
router.post('/notifications', createNotification);
router.get('/notifications/:userId', getNotifications); // Fetch all notifications for a user
router.get('/notifications/:id', getNotificationById);
router.put('/notifications/:id/read', markNotificationAsRead); // Mark as read
router.delete('/notifications/:id', deleteNotification);

export default router;
