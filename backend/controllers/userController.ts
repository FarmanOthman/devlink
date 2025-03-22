import { Request, Response } from 'express';
import { hashPassword, comparePassword } from '../config/auth';
import prisma from '../config/db';
import jwt from 'jsonwebtoken';
import { UserRole } from '../types';
import { tokenService } from '../services/tokenService';

// Helper function for logging errors
const logError = (error: unknown, message: string) => {
  console.error(message, error);
};

// Validate email format
const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password complexity
const validatePasswordComplexity = (password: string) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Get all users
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json({ success: true, data: users });
  } catch (error) {
    logError(error, 'Failed to fetch users');
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: errorMessage });
  }
};

// Create a new user (with password hashing)
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields: name, email, or password' });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    // Validate password length and complexity
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }
    if (!validatePasswordComplexity(password)) {
      return res.status(400).json({ success: false, message: 'Password must contain uppercase, lowercase, a number, and a symbol' });
    }

    // Check if the email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Hash the password before storing it
    const hashedPassword = await hashPassword(password);

    // Create the new user with DEVELOPER role - ignore any role that was provided in request
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'DEVELOPER', // Always set role to DEVELOPER, ignore any role in request
      },
    });

    // Exclude password from response
    const userWithoutPassword = { ...newUser, password: undefined };

    res.status(201).json({ success: true, data: userWithoutPassword });
  } catch (error) {
    logError(error, 'Error creating user');
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ success: false, message: 'Failed to create user', error: errorMessage });
  }
};

// Authenticate a user (login)
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
      },
    });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ message: 'Invalid credentials' });
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
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Logout user
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Clear the refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // If there's a refresh token, blacklist it
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      tokenService.blacklistToken(refreshToken);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update a user (with password hashing if password is provided)
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;
    const currentUserId = req.user?.userId;
    const isSelfUpdate = currentUserId === id;

    // Check if role is being updated and if the request is coming from a non-admin user
    if (role && req.user?.role !== UserRole.ADMIN) {
      return res.status(403).json({ success: false, message: 'Only admins can change user roles.' });
    }

    // Find the current user data before update
    const currentUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Validate email format if provided
    if (email && !validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
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
        return res.status(400).json({ success: false, message: 'Email already in use by another account' });
      }
    }

    if (password && password.length > 0 && !validatePasswordComplexity(password)) {
      return res.status(400).json({ success: false, message: 'Password must contain uppercase, lowercase, a number, and a symbol' });
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
        role: role && req.user?.role === UserRole.ADMIN ? role : undefined, // Only update role if user is admin
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
    logError(error, 'Error updating user');
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ success: false, message: 'Failed to update user', error: errorMessage });
  }
};

// Delete a user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.userId;
    const isSelfDelete = currentUserId === id;

    // Get user before deletion to verify existence
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    try {
      // First, perform the actual user delete operation
      await prisma.user.delete({
        where: { id }
      });
    } catch (deleteError) {
      console.error('Error deleting user:', deleteError);
      
      // If the error is related to foreign key constraints, 
      // it means we need to delete related records first
      if (deleteError instanceof Error && deleteError.message.includes('foreign key constraint')) {
        console.log('Attempting to delete related records first...');
        
        try {
          // Try to delete all possible related records
          // We're using individual try-catch blocks to ensure one failure doesn't stop others
          
          try {
            await prisma.userSkill.deleteMany({ where: { userId: id } });
          } catch (e) { console.log('No userSkill records or table not found'); }
          
          try {
            await prisma.application.deleteMany({ where: { userId: id } });
          } catch (e) { console.log('No application records or table not found'); }
          
          try {
            await prisma.document.deleteMany({ where: { userId: id } });
          } catch (e) { console.log('No document records or table not found'); }
          
          try {
            await prisma.savedJob.deleteMany({ where: { userId: id } });
          } catch (e) { console.log('No savedJob records or table not found'); }
          
          try {
            await prisma.education.deleteMany({ where: { userId: id } });
          } catch (e) { console.log('No education records or table not found'); }
          
          try {
            await prisma.experience.deleteMany({ where: { userId: id } });
          } catch (e) { console.log('No experience records or table not found'); }
          
          try {
            // Try with receiverId
            await prisma.message.deleteMany({
              where: { OR: [{ senderId: id }] }
            });
            
            // Try to delete messages where user is the recipient
            // Use a separate try/catch to handle different field names
            try {
              await prisma.message.deleteMany({
                where: { receiverId: id }
              });
            } catch {
              console.log('receiverId field not found on Message model');
            }
          } catch (e) {
            console.log('Error deleting messages or table not found');
          }
          
          // Now try to delete the user again
          await prisma.user.delete({ where: { id } });
        } catch (cascadeError) {
          console.error('Error in cascade deletion:', cascadeError);
          throw new Error('Failed to delete user and related records');
        }
      } else {
        // If it's not a foreign key issue, rethrow the original error
        throw deleteError;
      }
    }

    // Invalidate all tokens for this user
    await tokenService.invalidateAllUserTokens(id);

    // If the user is deleting their own account, clear cookies
    if (isSelfDelete) {
      // Clear the refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
    }

    // Log the account deletion event
    console.log(`User account ${id} deleted by ${isSelfDelete ? 'self' : 'admin'} (${currentUserId}) at ${new Date().toISOString()}`);

    // Return different response based on who performed the deletion
    if (isSelfDelete) {
      res.status(200).json({ 
        success: true, 
        message: 'Your account has been successfully deleted. You have been logged out.' 
      });
    } else {
      res.status(200).json({ 
        success: true, 
        message: 'User deleted successfully' 
      });
    }
  } catch (error) {
    logError(error, 'Error deleting user');
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ success: false, message: 'Failed to delete user', error: errorMessage });
  }
};

// Get a user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Exclude password from response
    const userWithoutPassword = { ...user, password: undefined };

    res.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    logError(error, 'Error fetching user');
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ success: false, message: 'Failed to fetch user', error: errorMessage });
  }
};

// Update a user's role
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (!role || !Object.values(UserRole).includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role provided' });
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
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
    logError(error, 'Error updating user role');
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ success: false, message: 'Failed to update user role', error: errorMessage });
  }
};
