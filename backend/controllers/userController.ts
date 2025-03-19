import { Request, Response } from 'express';
import { hashPassword, comparePassword } from '../config/auth';
import prisma from '../config/db';

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
    const { name, email, password } = req.body;

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

    // Create the new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
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

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const userWithoutPassword = { ...user, password: undefined };

    res.json({ success: true, data: userWithoutPassword, message: 'Login successful' });
  } catch (error) {
    logError(error, 'Error during login');
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ success: false, message: 'Failed to authenticate user', error: errorMessage });
  }
};

// Update a user (with password hashing if password is provided)
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

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
