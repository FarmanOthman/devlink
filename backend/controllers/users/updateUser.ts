import { Response } from 'express';
import prisma from '../../config/db';
import { hashPassword } from '../../config/auth';
import { UserRole } from '../../types';
import { tokenService } from '../../services/tokenService';
import { 
  validateEmail, 
  validatePasswordComplexity, 
  validateUrl,
  validateBio,
  validateLocation,
  handleApiError,
  ErrorCodes,
  createValidationError,
  AuthenticatedRequest 
} from './utils';

// Update a user (with password hashing if password is provided)
export const updateUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      email, 
      password, 
      role, 
      bio, 
      location, 
      githubUrl, 
      linkedinUrl, 
      portfolioUrl 
    } = req.body;
    
    const currentUserId = req.user?.userId;
    const isSelfUpdate = currentUserId === id;

    // Check if role is being updated and if the request is coming from a non-admin user
    if (role && req.user?.role !== UserRole.ADMIN) {
      return res.status(403).json({ 
        success: false, 
        error: {
          code: ErrorCodes.AUTHORIZATION_ERROR,
          message: 'Only admins can change user roles'
        }
      });
    }

    // Find the current user data before update
    const currentUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!currentUser) {
      return res.status(404).json({ 
        success: false, 
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: 'User not found'
        }
      });
    }

    // Validate email format if provided
    if (email && !validateEmail(email)) {
      throw createValidationError('Invalid email format');
    }

    // Check if the email already exists for another user
    if (email && email !== currentUser.email) {
      const existingUser = await prisma.user.findFirst({
        where: { 
          email,
          id: { not: id } // Exclude current user
        },
      });
      
      if (existingUser) {
        return res.status(409).json({ 
          success: false, 
          error: {
            code: ErrorCodes.CONFLICT,
            message: 'Email already in use by another account'
          }
        });
      }
    }

    // Validate password if provided
    if (password && password.length > 0) {
      if (password.length < 8) {
        throw createValidationError('Password must be at least 8 characters long');
      }
      if (!validatePasswordComplexity(password)) {
        throw createValidationError('Password must contain uppercase, lowercase, a number, and a symbol');
      }
    }

    // Validate URLs if provided
    if (githubUrl && !validateUrl(githubUrl)) {
      throw createValidationError('Invalid GitHub URL format');
    }
    
    if (linkedinUrl && !validateUrl(linkedinUrl)) {
      throw createValidationError('Invalid LinkedIn URL format');
    }
    
    if (portfolioUrl && !validateUrl(portfolioUrl)) {
      throw createValidationError('Invalid portfolio URL format');
    }
    
    // Validate bio and location length
    if (bio && !validateBio(bio)) {
      throw createValidationError('Bio exceeds maximum length of 500 characters');
    }
    
    if (location && !validateLocation(location)) {
      throw createValidationError('Location exceeds maximum length of 100 characters');
    }

    let hashedPassword;
    if (password) {
      hashedPassword = await hashPassword(password);
    }

    // Check if critical information is being updated (email, role, password)
    const isCriticalUpdate = 
      (email && email !== currentUser.email) || 
      (role && role !== currentUser.role) || 
      password;

    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: {
        name,
        email,
        password: hashedPassword || undefined,
        role: role && req.user?.role === UserRole.ADMIN ? role : undefined,
        bio,
        location,
        githubUrl,
        linkedinUrl,
        portfolioUrl
      },
    });

    // Handle session and token updates for critical information changes
    if (isCriticalUpdate && isSelfUpdate) {
      // For self-updates with critical changes, we need to regenerate tokens
      
      // Generate new token pair if email or role changed
      if (email !== currentUser.email || (role && role !== currentUser.role)) {
        const { accessToken, refreshToken } = await tokenService.generateTokenPair(
          updatedUser.id, 
          updatedUser.role, 
          updatedUser.email
        );
        
        // Set the new refresh token in HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        // Return the new access token
        const userWithoutPassword = { ...updatedUser, password: undefined };
        return res.json({ 
          success: true, 
          data: userWithoutPassword,
          accessToken,
          message: 'User updated successfully. Please use the new credentials.'
        });
      }
      
      // If only password changed, invalidate existing sessions
      if (password) {
        // Get the refresh token from cookies
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
          // Blacklist the current refresh token
          await tokenService.blacklistToken(refreshToken);
          
          // Clear the refresh token cookie
          res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
          });
        }
        
        // Generate new token pair
        const { accessToken, refreshToken: newRefreshToken } = await tokenService.generateTokenPair(
          updatedUser.id, 
          updatedUser.role, 
          updatedUser.email
        );
        
        // Set the new refresh token in HTTP-only cookie
        res.cookie('refreshToken', newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        // Return the new access token
        const userWithoutPassword = { ...updatedUser, password: undefined };
        return res.json({ 
          success: true, 
          data: userWithoutPassword,
          accessToken,
          message: 'Password updated successfully. You have been re-authenticated.'
        });
      }
    } else if (isCriticalUpdate && !isSelfUpdate && req.user?.role === UserRole.ADMIN) {
      // Admin updating another user's critical info
      // Force user logout from all sessions by invalidating their refresh tokens
      await tokenService.invalidateAllUserTokens(id);
    }

    // Update user activity timestamp
    await tokenService.checkActivity(id);

    const userWithoutPassword = { ...updatedUser, password: undefined };
    res.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    handleApiError(res, error, 'Failed to update user');
  }
}; 