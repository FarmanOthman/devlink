import { ApiError, ErrorCodes } from './errorHandlers';

/**
 * Validates an email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password complexity
 * Requires at least 8 characters, one uppercase letter, one lowercase letter,
 * one number, and one special character
 */
export const validatePasswordComplexity = (password: string): boolean => {
  if (password.length < 8) return false;
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  return hasUpperCase && hasLowerCase && hasNumbers && hasSymbols;
};

/**
 * Generic required field validator
 * Creates a validation error if any required fields are missing
 */
export const validateRequiredFields = (
  data: Record<string, unknown>,
  requiredFields: string[]
): ApiError | null => {
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    return {
      code: ErrorCodes.VALIDATION,
      message: `Missing required fields: ${missingFields.join(', ')}`,
    };
  }
  
  return null;
}; 