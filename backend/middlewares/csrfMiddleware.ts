import { Request, Response, NextFunction, RequestHandler } from 'express';

const ERROR_MESSAGES = {
    NO_TOKEN: 'CSRF token not found',
    INVALID_TOKEN: 'Invalid CSRF token',
};

const STATUS_CODES = {
    FORBIDDEN: 403,
};

// Routes that don't need CSRF protection
const CSRF_EXEMPT_ROUTES = [
    '/user/login',
    '/user/register',
    '/user/logout',
    '/user/forgot-password',
    '/user/reset-password',
];

/**
 * Middleware to validate CSRF tokens
 * This should be used on all routes that modify data (POST, PUT, DELETE)
 */
const csrfMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
    // Skip CSRF check for GET and HEAD requests
    if (req.method === 'GET' || req.method === 'HEAD') {
        return next();
    }

    // Skip CSRF check for exempt routes
    const path = req.path;
    if (CSRF_EXEMPT_ROUTES.some(route => path.startsWith(route))) {
        return next();
    }

    // Skip CSRF check if we're not in production and there's a special header
    if (process.env.NODE_ENV !== 'production' && req.headers['x-skip-csrf-check']) {
        return next();
    }

    const csrfToken = req.headers['x-xsrf-token'] || req.headers['x-csrf-token'];
    const cookieToken = req.cookies['XSRF-TOKEN'];

    if (!csrfToken || !cookieToken) {
        res.status(STATUS_CODES.FORBIDDEN).json({ 
            message: ERROR_MESSAGES.NO_TOKEN,
            tip: 'For testing in development, you can add x-skip-csrf-check header'
        });
        return;
    }

    if (csrfToken !== cookieToken) {
        res.status(STATUS_CODES.FORBIDDEN).json({ message: ERROR_MESSAGES.INVALID_TOKEN });
        return;
    }

    next();
};

export default csrfMiddleware; 