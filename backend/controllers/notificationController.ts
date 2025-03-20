import { Request, Response } from 'express';
import prisma from '../config/db';

// Create a new notification
export const createNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, message } = req.body;

    // Validate required fields
    if (!userId || !message) {
      res.status(400).json({ message: 'Missing required fields: userId or message' });
      return;
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Create the new notification
    const newNotification = await prisma.notification.create({
      data: {
        userId,
        message,
      },
    });

    res.status(201).json(newNotification);
  } catch (error) {
    console.error('Error creating notification:', error);

    // Handle Prisma errors
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      res.status(400).json({ message: 'Notification creation failed due to unique constraint violation' });
      return;
    }

    // Handle other unexpected errors
    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to create notification', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to create notification', error: 'Unknown error occurred' });
    }
  }
};

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
