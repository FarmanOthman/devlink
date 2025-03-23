import { Request, Response } from 'express';
import prisma from '../../config/db';
import { UserRole } from '../../types';
import { handleApiError, ErrorCodes, createValidationError } from './utils';

// Update a user's role
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (!role || !Object.values(UserRole).includes(role)) {
      throw createValidationError('Invalid role provided');
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: 'User not found'
        }
      });
    }

    // Update the user's role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
    });

    // Exclude password from response
    const userWithoutPassword = { ...updatedUser, password: undefined };

    res.json({ success: true, data: userWithoutPassword, message: 'User role updated successfully' });
  } catch (error) {
    handleApiError(res, error, 'Failed to update user role');
  }
}; 