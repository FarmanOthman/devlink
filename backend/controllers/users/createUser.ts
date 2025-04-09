import { Request, Response } from 'express';
import prisma from '../../config/db';
import { hashPassword } from '../../config/auth';
import { 
  validateEmail, 
  validatePasswordComplexity, 
  handleApiError, 
  ErrorCodes, 
  createValidationError,
  validateRequiredFields
} from '../utils';

/**
 * Create a new user with password hashing
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    const validationError = validateRequiredFields(
      req.body, 
      ['name', 'email', 'password']
    );
    
    if (validationError) {
      throw validationError;
    }

    // Validate email format
    if (!validateEmail(email)) {
      throw createValidationError('Invalid email format');
    }

    // Validate password length and complexity
    if (!validatePasswordComplexity(password)) {
      throw createValidationError('Password must be at least 8 characters and contain uppercase, lowercase, a number, and a symbol');
    }

    // Check if the email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      res.status(409).json({ 
        success: false, 
        error: {
          code: ErrorCodes.CONFLICT,
          message: 'Email already exists'
        }
      });
      return;
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
    handleApiError(res, error, 'Failed to create user');
  }
}; 