import { Request, Response } from 'express';
import { hashPassword, comparePassword } from '../config/auth';
import prisma from '../config/db';
import jwt from 'jsonwebtoken';
import { UserRole } from '../types';

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
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT token with user ID, email, and role
    const token = jwt.sign({ 
      userId: user.id, 
      email: user.email,
      role: user.role 
    }, process.env.JWT_SECRET as string, {
      expiresIn: '1h', // Token expiration time
    });

    // Generate CSRF token
    const csrfToken = require('crypto').randomBytes(32).toString('hex');

    // Store user info and CSRF token in session
    req.session.userId = user.id;
    req.session.role = user.role as UserRole;
    req.session.userEmail = user.email;
    req.session.accessToken = token;
    req.session.createdAt = Date.now();

    // Save session
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        resolve();
      });
    });

    // Common cookie options
    const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds (safe integer)
    const commonCookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' as const : 'lax' as const,
      domain: process.env.COOKIE_DOMAIN || undefined,
      path: '/',
      maxAge: ONE_HOUR,
    };

    // Set JWT cookie (HTTP-only)
    res.cookie('jwt', token, {
      ...commonCookieOptions,
      httpOnly: true, // Always HTTP-only for JWT
    });

    // Set CSRF token cookie (accessible to JavaScript)
    res.cookie('XSRF-TOKEN', csrfToken, {
      ...commonCookieOptions,
      httpOnly: false, // Must be accessible to JavaScript
    });

    // Set session cookie (HTTP-only)
    res.cookie('sessionId', req.sessionID, {
      ...commonCookieOptions,
      httpOnly: true, // Always HTTP-only for session
    });

    // Return user info (excluding password) and CSRF token
    const userWithoutPassword = { 
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({ 
      success: true, 
      user: userWithoutPassword,
      message: 'Login successful'
    });
  } catch (error) {
    logError(error, 'Error during login');
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ success: false, message: 'Failed to authenticate user', error: errorMessage });
  }
};

// Logout user
export const logoutUser = async (req: Request, res: Response) => {
  try {
    // Destroy session
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) reject(err);
        resolve();
      });
    });

    res.clearCookie('sessionId'); // Clear session cookie
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logError(error, 'Error during logout');
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ success: false, message: 'Failed to logout', error: errorMessage });
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
