import express, { RequestHandler } from 'express';
import {
  createNotification,
  getNotifications,
  getNotificationById,
  markNotificationAsRead,
  deleteNotification
} from '../controllers/notificationController';
import authMiddleware from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import ownershipCheck from '../middlewares/ownershipMiddleware';
import { UserRole } from '../types';

const router = express.Router();

// POST /notifications: Only Admins and system can create notifications
router.post('/notifications', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.ADMIN]) as RequestHandler,
  createNotification as RequestHandler
);

// GET /notifications/:userId: Users can view their own notifications, Admins can view any user's notifications
router.get('/notifications/:userId', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck('user') as RequestHandler,
  getNotifications as RequestHandler
);

// GET /notifications/detail/:id: Users can view their own notification details, Admins can view any notification
router.get('/notifications/detail/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck('notification') as RequestHandler,
  getNotificationById as RequestHandler
);

// PUT /notifications/:id/read: Users can mark their own notifications as read, Admins can mark any notification
router.put('/notifications/:id/read', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck('notification') as RequestHandler,
  markNotificationAsRead as RequestHandler
);

// DELETE /notifications/:id: Users can delete their own notifications, Admins can delete any notification
router.delete('/notifications/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck('notification') as RequestHandler,
  deleteNotification as RequestHandler
);

export default router;
