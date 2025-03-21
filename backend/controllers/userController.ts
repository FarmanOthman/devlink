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

    // Create the new user with role (if provided)
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role ? role : undefined, // Set role if provided
        deletedAt: null,  // Soft delete flag
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

    if (password && password.length > 0 && !validatePasswordComplexity(password)) {
      return res.status(400).json({ success: false, message: 'Password must contain uppercase, lowercase, a number, and a symbol' });
    }

    let hashedPassword;
    if (password) {
      hashedPassword = await hashPassword(password);
    }

    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: {
        name,
        email,
        password: hashedPassword || undefined,
        role: role || undefined, // Update role if provided
      },
    });

    const userWithoutPassword = { ...updatedUser, password: undefined };

    res.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    logError(error, 'Error updating user');
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ success: false, message: 'Failed to update user', error: errorMessage });
  }
};

// Soft delete a user (set deletedAt to current date)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.user.update({
      where: { id: id },
      data: { deletedAt: new Date() },
    });

    res.status(204).json({ success: true, message: 'User deleted successfully' });
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
