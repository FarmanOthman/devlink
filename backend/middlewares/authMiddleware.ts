import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, UserRole } from '../types';

// Constants for error messages and status codes
const ERROR_MESSAGES = {
    NO_AUTH: 'Access denied. Authentication required.',
    INVALID_TOKEN: 'Invalid token.',
    MISSING_SECRET: 'JWT secret is not defined.',
};

const STATUS_CODES = {
    UNAUTHORIZED: 401,
    BAD_REQUEST: 400,
};

const authMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
    // First check if user is authenticated via session
    if (req.session.userId && req.session.role) {
        req.user = {
            userId: req.session.userId,
            role: req.session.role as UserRole,
            email: req.session.userEmail || ''
        };
        return next();
    }

    // If no session, check for JWT token
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        res.status(STATUS_CODES.UNAUTHORIZED).json({ message: ERROR_MESSAGES.NO_AUTH });
        return;
    }

    if (!process.env.JWT_SECRET) {
        res.status(STATUS_CODES.BAD_REQUEST).json({ message: ERROR_MESSAGES.MISSING_SECRET });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
        req.user = decoded;

        // Store user info in session for future requests
        req.session.userId = decoded.userId;
        req.session.role = decoded.role;
        req.session.userEmail = decoded.email;
        req.session.accessToken = token;

        next();
    } catch (error) {
        res.status(STATUS_CODES.BAD_REQUEST).json({ message: ERROR_MESSAGES.INVALID_TOKEN });
    }
};

export default authMiddleware;