import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

// Constants for error messages and status codes
const ERROR_MESSAGES = {
    NO_TOKEN: 'Access denied. No token provided.',
    INVALID_TOKEN: 'Invalid token.',
    MISSING_SECRET: 'JWT secret is not defined.',
};

const STATUS_CODES = {
    UNAUTHORIZED: 401,
    BAD_REQUEST: 400,
};

const authMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        res.status(STATUS_CODES.UNAUTHORIZED).json({ message: ERROR_MESSAGES.NO_TOKEN });
        return;
    }

    if (!process.env.JWT_SECRET) {
        res.status(STATUS_CODES.BAD_REQUEST).json({ message: ERROR_MESSAGES.MISSING_SECRET });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
        req.user = decoded; // Attach user info to the request object
        next();
    } catch (error) {
        res.status(STATUS_CODES.BAD_REQUEST).json({ message: ERROR_MESSAGES.INVALID_TOKEN });
    }
};

export default authMiddleware;