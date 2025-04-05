import { Request, Response } from 'express';
import prisma from '../../config/db';
import crypto from 'crypto';
import { emailService } from '../../services/emailService';
import { handleApiError, ErrorCodes, createValidationError } from '../utils';
import { validateEmail } from '../utils/validators';

// Handle forgot password request
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !validateEmail(email)) {
      throw createValidationError('Please provide a valid email address');
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Don't reveal if user exists or not
    if (!user) {
      res.json({
        success: true,
        message: 'If a user with that email exists, they will receive password reset instructions.',
      });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save the reset token and expiry
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Send reset email
    const emailSent = await emailService.sendPasswordResetEmail(
      user.email,
      resetToken,
      user.name
    );

    if (!emailSent) {
      throw new Error('Failed to send password reset email');
    }

    res.json({
      success: true,
      message: 'If a user with that email exists, they will receive password reset instructions.',
    });
  } catch (error) {
    handleApiError(res, error, 'Failed to process password reset request');
  }
}; 