import { Request, Response } from 'express';
import prisma from '../../config/db';
import { comparePassword } from '../../config/auth';
import { tokenService } from '../../services/tokenService';
import { 
  handleApiError, 
  ErrorCodes, 
  createValidationError,
  logError 
} from './utils';

// Authenticate a user (login)
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      throw createValidationError('Email and password are required');
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
      },
    });

    // Generic error message for security (don't reveal if user exists)
    if (!user) {
      // Log with specific info but return generic message to user
      logError(
        new Error(`Login attempt with non-existent email: ${email}`),
        'Invalid login attempt',
        { attemptedEmail: email }
      );
      
      res.status(401).json({
        success: false,
        error: {
          code: ErrorCodes.AUTHENTICATION_ERROR,
          message: 'Invalid email or password'
        }
      });
      return;
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      // Log with specific info but return generic message to user
      logError(
        new Error(`Invalid password attempt for user: ${user.id}`),
        'Invalid login password',
        { userId: user.id }
      );
      
      res.status(401).json({
        success: false,
        error: {
          code: ErrorCodes.AUTHENTICATION_ERROR,
          message: 'Invalid email or password'
        }
      });
      return;
    }

    // Generate token pair
    const { accessToken, refreshToken } = await tokenService.generateTokenPair(user.id, user.role, user.email);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Update user's last active timestamp
    await tokenService.checkActivity(user.id);

    // Send access token and user info
    res.json({
      success: true,
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    handleApiError(res, error, 'Login failed');
  }
}; 