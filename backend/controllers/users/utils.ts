import { Request, Response } from 'express';

// Export AuthenticatedRequest type
export type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    email: string;
    role: string;
  };
};

// Error types for user-related operations
export type ErrorWithCode = Error & { code?: string | number };

export enum ErrorCodes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  SERVER_ERROR = 'SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR'
}

export interface ApiError {
  code: string;
  message: string;
  details?: string[];
}

// Enhanced error logger that scrubs sensitive data
export const logError = (error: unknown, message: string, additionalInfo?: Record<string, any>) => {
  const timestamp = new Date().toISOString();
  
  // Sanitize additional info to remove sensitive data
  const sanitizedInfo = additionalInfo ? sanitizeErrorData(additionalInfo) : {};
  
  const errorDetails = error instanceof Error 
    ? { 
        name: error.name, 
        message: error.message, 
        code: (error as ErrorWithCode).code,
        // Avoid logging full stack traces in production
        stack: process.env.NODE_ENV === 'production' ? undefined : error.stack 
      } 
    : { rawError: String(error) };

  console.error({
    timestamp,
    message,
    ...sanitizedInfo,
    error: errorDetails
  });
};

// Sanitize error data to remove sensitive information
const sanitizeErrorData = (data: Record<string, any>): Record<string, any> => {
  const sensitiveFields = ['password', 'token', 'refreshToken', 'accessToken', 'secret', 'apiKey'];
  const sanitized = { ...data };
  
  // Helper function to recursively sanitize objects
  const sanitizeObject = (obj: Record<string, any>): Record<string, any> => {
    const result = { ...obj };
    
    for (const key in result) {
      // If this key should be sanitized
      if (sensitiveFields.includes(key)) {
        result[key] = '[REDACTED]';
      } 
      // If value is an object, recursively sanitize
      else if (result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) {
        result[key] = sanitizeObject(result[key]);
      }
      // If value is an array, check each element
      else if (Array.isArray(result[key])) {
        result[key] = result[key].map((item: any) => 
          typeof item === 'object' && item !== null ? sanitizeObject(item) : item
        );
      }
    }
    
    return result;
  };
  
  return sanitizeObject(sanitized);
};

// Centralized error handler for consistent API responses
export const handleApiError = (res: Response, error: unknown, customMessage?: string): void => {
  // PrismaClientKnownRequestError specific handling
  if (error instanceof Error && 'code' in error) {
    const prismaError = error as ErrorWithCode;
    
    // Handle specific Prisma error codes
    if (prismaError.code === 'P2002') {
      // Unique constraint violation
      res.status(409).json({ 
        success: false, 
        error: {
          code: ErrorCodes.CONFLICT,
          message: 'Resource already exists with this unique field'
        }
      });
      return;
    }
    
    if (prismaError.code === 'P2025') {
      // Record not found
      res.status(404).json({ 
        success: false, 
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: customMessage || 'Requested resource not found'
        }
      });
      return;
    }
  }
  
  // General error handling
  if (error instanceof Error) {
    // Log the error (sanitized)
    logError(error, customMessage || 'API error occurred');
    
    // Determine appropriate status code and message for client
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      res.status(400).json({ 
        success: false, 
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: customMessage || 'Invalid data provided'
        }
      });
    } else if (error.message.includes('permission') || error.message.includes('authorization')) {
      res.status(403).json({ 
        success: false, 
        error: {
          code: ErrorCodes.AUTHORIZATION_ERROR,
          message: customMessage || 'You do not have permission to perform this action'
        }
      });
    } else if (error.message.includes('not found')) {
      res.status(404).json({ 
        success: false, 
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: customMessage || 'Resource not found'
        }
      });
    } else {
      // Default internal server error
      res.status(500).json({ 
        success: false, 
        error: {
          code: ErrorCodes.SERVER_ERROR,
          message: customMessage || 'An unexpected error occurred'
        }
      });
    }
  } else {
    // Unknown error type
    logError(error, 'Unknown error type');
    res.status(500).json({ 
      success: false, 
      error: {
        code: ErrorCodes.SERVER_ERROR,
        message: 'An unexpected error occurred'
      }
    });
  }
};

// Validation error helper
export const createValidationError = (message: string, details?: string[]): Error => {
  const error = new Error(message);
  (error as ErrorWithCode).code = ErrorCodes.VALIDATION_ERROR;
  return error;
};

// Validate email format
export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password complexity
export const validatePasswordComplexity = (password: string) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Validate URL format
export const validateUrl = (url: string) => {
  if (!url) return true; // Empty URLs are valid (optional fields)
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

// Validate bio length
export const validateBio = (bio: string, maxLength = 500) => {
  if (!bio) return true; // Empty bio is valid (optional field)
  return bio.length <= maxLength;
};

// Validate location
export const validateLocation = (location: string, maxLength = 100) => {
  if (!location) return true; // Empty location is valid (optional field)
  return location.length <= maxLength;
}; 