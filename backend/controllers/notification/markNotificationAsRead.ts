import { Request, Response } from 'express';
import prisma from '../../config/db';

// Mark a notification as read
export const markNotificationAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if the notification exists
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    // Update the notification to mark it as read
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json(updatedNotification);
  } catch (error) {
    console.error('Error updating notification:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to update notification', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to update notification', error: 'Unknown error occurred' });
    }
  }
}; 