import { Request, Response } from 'express';
import prisma from '../../config/db';

// Delete a notification by ID
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
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

    // Delete the notification from the database
    await prisma.notification.delete({
      where: { id },
    });

    res.status(204).send(); // 204 No Content
  } catch (error) {
    console.error('Error deleting notification:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to delete notification', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to delete notification', error: 'Unknown error occurred' });
    }
  }
}; 