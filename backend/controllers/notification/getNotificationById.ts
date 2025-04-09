import { Request, Response } from 'express';
import prisma from '../../config/db';

// Get a single notification by ID
export const getNotificationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        user: true, // Include user details
      },
    });

    if (!notification) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    res.json(notification);
  } catch (error) {
    console.error('Error fetching notification:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch notification', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch notification', error: 'Unknown error occurred' });
    }
  }
}; 