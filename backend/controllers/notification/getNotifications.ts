import { Request, Response } from 'express';
import prisma from '../../config/db';

// Get all notifications for a user
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Fetch notifications for the given user
    const notifications = await prisma.notification.findMany({
      where: { userId },
      include: {
        user: true, // Include user details
      },
      orderBy: {
        createdAt: 'desc', // Sort notifications by the most recent first
      },
    });

    if (notifications.length === 0) {
      res.status(404).json({ message: 'No notifications found for this user' });
      return;
    }

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch notifications', error: 'Unknown error occurred' });
    }
  }
}; 