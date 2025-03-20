import { Request, Response, NextFunction, RequestHandler } from 'express';
import { JwtPayload, UserRole } from '../types';

// Constants for error messages and status codes
const ERROR_MESSAGES = {
    ACCESS_DENIED: 'Access denied. Insufficient permissions.',
    UNAUTHORIZED: 'Access denied. User not authenticated.',
};

const STATUS_CODES = {
    FORBIDDEN: 403,
    UNAUTHORIZED: 401,
};

const authorizationMiddleware = (allowedRoles: UserRole[]): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction): void => {
        // Check if user is authenticated
        const user = req.user;

        if (!user) {
            res.status(STATUS_CODES.UNAUTHORIZED).json({ message: ERROR_MESSAGES.UNAUTHORIZED });
            return;
        }

        // Check if the user's role is allowed
        if (!allowedRoles.includes(user.role)) {
            res.status(STATUS_CODES.FORBIDDEN).json({ 
                message: ERROR_MESSAGES.ACCESS_DENIED,
                requiredRoles: allowedRoles,
                userRole: user.role
            });
            return;
        }

        next();
    };
};

export default authorizationMiddleware;