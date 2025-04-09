import { Request, Response } from 'express';
import prisma from '../../config/db';
import { 
  handleApiError,
  validateRequiredFields,
  ErrorCodes
} from '../utils';

/**
 * Create a new notification for a user
 */
export const createNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, message, type = 'GENERAL' } = req.body;

    // Validate required fields
    const validationError = validateRequiredFields(
      req.body,
      ['userId', 'message']
    );
    
    if (validationError) {
      throw validationError;
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: 'User not found'
        }
      });
      return;
    }

    // Create the new notification
    const newNotification = await prisma.notification.create({
      data: {
        userId,
        message,
        type
      },
    });

    res.status(201).json({
      success: true,
      data: newNotification
    });
  } catch (error) {
    handleApiError(res, error, 'Failed to create notification');
  }
}; 