import { Response } from 'express';

export interface ApiError {
  code: ErrorCodes;
  message: string;
  details?: unknown;
}

export enum ErrorCodes {
  VALIDATION = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  INTERNAL = 'INTERNAL_SERVER_ERROR',
}

/**
 * Create a validation error with standard format
 */
export const createValidationError = (message: string): ApiError => {
  return {
    code: ErrorCodes.VALIDATION,
    message,
  };
};

/**
 * Handle API errors consistently across controllers
 */
export const handleApiError = (
  res: Response, 
  error: unknown, 
  defaultMessage = 'An unexpected error occurred'
): void => {
  console.error(error);

  // Handle Prisma-specific errors
  if (error instanceof Error && 'code' in error) {
    switch (error.code) {
      case 'P2002':
        res.status(409).json({
          success: false,
          error: {
            code: ErrorCodes.CONFLICT,
            message: 'A record with this identifier already exists',
          },
        });
        return;
      case 'P2025':
        res.status(404).json({
          success: false,
          error: {
            code: ErrorCodes.NOT_FOUND,
            message: 'Record not found',
          },
        });
        return;
    }
  }
  
  // Handle custom API errors
  if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
    const apiError = error as ApiError;
    
    switch (apiError.code) {
      case ErrorCodes.VALIDATION:
        res.status(400).json({
          success: false,
          error: apiError,
        });
        return;
      case ErrorCodes.NOT_FOUND:
        res.status(404).json({
          success: false,
          error: apiError,
        });
        return;
      case ErrorCodes.UNAUTHORIZED:
        res.status(401).json({
          success: false,
          error: apiError,
        });
        return;
      case ErrorCodes.FORBIDDEN:
        res.status(403).json({
          success: false,
          error: apiError,
        });
        return;
      case ErrorCodes.CONFLICT:
        res.status(409).json({
          success: false,
          error: apiError,
        });
        return;
    }
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    res.status(500).json({
      success: false,
      error: {
        code: ErrorCodes.INTERNAL,
        message: error.message || defaultMessage,
      },
    });
    return;
  }
  
  // Handle unknown errors
  res.status(500).json({
    success: false,
    error: {
      code: ErrorCodes.INTERNAL,
      message: defaultMessage,
    },
  });
}; 