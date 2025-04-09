import { Request, Response } from 'express';
import prisma from '../../config/db';
import { 
  handleApiError,
  validateRequiredFields,
  ErrorCodes
} from '../utils';

/**
 * Controller method description
 * 
 * @param req - Express request object
 * @param res - Express response object
 */
export const controllerMethodName = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Extract and validate input
    const { /* destructure parameters */ } = req.body; // or req.params, req.query
    
    // Validate required fields
    const validationError = validateRequiredFields(
      req.body, // or req.params, req.query
      ['field1', 'field2'] // list required fields
    );
    
    if (validationError) {
      throw validationError;
    }
    
    // 2. Business logic
    // Example: Query database, process data, etc.
    // Replace 'user' with the actual model name from your Prisma schema
    const result = await prisma.user.findUnique({
      where: { id: 'example-id' }
      // Other Prisma operation parameters
    });
    
    // 3. Handle specific conditions
    if (!result) {
      res.status(404).json({
        success: false,
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: 'Resource not found'
        }
      });
      return;
    }
    
    // 4. Return success response
    res.status(200).json({ 
      success: true, 
      data: result 
    });
  } catch (error) {
    // 5. Handle errors
    handleApiError(res, error, 'Failed to perform operation');
  }
}; 