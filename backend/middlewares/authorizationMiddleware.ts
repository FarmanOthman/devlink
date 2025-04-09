import { Request, Response, NextFunction, RequestHandler } from 'express';
import { UserRole } from '../types';

// Constants for error messages and status codes
const ERROR_MESSAGES = {
    ACCESS_DENIED: 'Access denied. Insufficient permissions.',
    UNAUTHORIZED: 'Access denied. User not authenticated.',
    EMPTY_ROLES: 'Access denied. No roles are allowed.',
    INVALID_ROLE: 'Access denied. Invalid user role.',
    SERVER_ERROR: 'Internal server error'
};

const STATUS_CODES = {
    FORBIDDEN: 403,
    UNAUTHORIZED: 401,
    SERVER_ERROR: 500
};

interface AuthOptions {
    unauthorizedMessage?: string;
    forbiddenMessage?: string;
    emptyRolesMessage?: string;
    invalidRoleMessage?: string;
}

const authorizationMiddleware = (allowedRoles: UserRole[], options?: AuthOptions): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction): void => {
        // Check if user is authenticated
        const user = req.user;

        if (!user) {
            res.status(STATUS_CODES.UNAUTHORIZED).json({ 
                message: options?.unauthorizedMessage || ERROR_MESSAGES.UNAUTHORIZED 
            });
            return;
        }

        // Check if user role is undefined or null
        if (user.role === undefined || user.role === null) {
            res.status(STATUS_CODES.SERVER_ERROR).json({ 
                message: ERROR_MESSAGES.SERVER_ERROR,
                details: 'User role is undefined' 
            });
            return;
        }

        // Validate that allowedRoles array is not empty
        if (allowedRoles.length === 0) {
            res.status(STATUS_CODES.FORBIDDEN).json({ 
                message: options?.emptyRolesMessage || ERROR_MESSAGES.EMPTY_ROLES,
                requiredRoles: allowedRoles,
                userRole: user.role
            });
            return;
        }

        // Check if the user's role exists in the UserRole enum (valid role check)
        const isValidRole = Object.values(UserRole).includes(user.role as any);
        if (!isValidRole) {
            res.status(STATUS_CODES.FORBIDDEN).json({ 
                message: options?.invalidRoleMessage || ERROR_MESSAGES.INVALID_ROLE,
                requiredRoles: allowedRoles,
                userRole: user.role
            });
            return;
        }

        // Check if the user's role is allowed
        if (!allowedRoles.includes(user.role)) {
            res.status(STATUS_CODES.FORBIDDEN).json({ 
                message: options?.forbiddenMessage || ERROR_MESSAGES.ACCESS_DENIED,
                requiredRoles: allowedRoles,
                userRole: user.role
            });
            return;
        }

        next();
    };
};
export default authorizationMiddleware;