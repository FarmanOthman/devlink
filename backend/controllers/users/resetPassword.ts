import { Request, Response } from 'express';
import prisma from '../../config/db';
import { hashPassword } from '../../config/auth';
import { emailService } from '../../services/emailService';
import { handleApiError, ErrorCodes, createValidationError } from '../utils';
import { validatePasswordComplexity } from '../utils/validators';

// Handle password reset
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    // Validate required fields
    if (!token || !password) {
      throw createValidationError('Token and new password are required');
    }

    // Validate password complexity
    if (!validatePasswordComplexity(password)) {
      throw createValidationError('Password must be at least 8 characters and contain uppercase, lowercase, a number, and a symbol');
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        error: {
          code: ErrorCodes.VALIDATION,
          message: 'Invalid or expired reset token',
        },
      });
      return;
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update user's password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Send confirmation email
    await emailService.sendPasswordChangedEmail(user.email, user.name);

    res.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    handleApiError(res, error, 'Failed to reset password');
  }
}; 