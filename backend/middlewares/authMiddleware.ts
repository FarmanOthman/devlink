import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../config/auth';
import { tokenService } from '../services/tokenService';
import { JwtPayload } from '../types/userTypes';
import rateLimit from 'express-rate-limit';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Rate limiting for authentication attempts
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { message: 'Too many authentication attempts, please try again later' }
});

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Skip CSRF check for development with specific header
    if (process.env.NODE_ENV === 'development' && req.headers['x-skip-csrf-check']) {
      // Continue with authentication
    } else {
      // Check CSRF token
      const csrfToken = req.headers['x-csrf-token'];
      if (!csrfToken || typeof csrfToken !== 'string') {
        return res.status(403).json({ message: 'CSRF token missing' });
      }
      
      // Verify CSRF token here (implement your CSRF verification logic)
    }

    // Get the access token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'No token provided',
        tip: process.env.NODE_ENV === 'development' ? 'Add Authorization: Bearer <token> header' : undefined
      });
    }

    const accessToken = authHeader.split(' ')[1];
    
    try {
      // Verify the access token
      const decoded = verifyAccessToken(accessToken);
      req.user = decoded;

      // Check for token expiration
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < currentTime) {
        return res.status(401).json({ 
          message: 'Token has expired',
          tip: 'Please refresh your token or login again'
        });
      }

      // Check for inactivity timeout
      const hasExceededTimeout = await tokenService.hasExceededInactivityTimeout(decoded.userId);
      if (hasExceededTimeout) {
        return res.status(401).json({ 
          message: 'Session expired due to inactivity',
          tip: 'Please login again'
        });
      }

      // Update user activity
      await tokenService.checkActivity(decoded.userId);

      // Add security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');

      next();
    } catch (error) {
      if (error instanceof Error) {
        return res.status(401).json({ 
          message: 'Invalid token',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
      return res.status(401).json({ message: 'Authentication failed' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const refreshTokenMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    try {
      const { accessToken, refreshToken: newRefreshToken } = await tokenService.rotateRefreshToken(refreshToken);

      // Set the new refresh token in a secure cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Clear old refresh token from cookie
      res.clearCookie('refreshToken', { path: '/' });

      // Send the new access token
      res.json({ 
        accessToken,
        expiresIn: 900 // 15 minutes in seconds
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(401).json({ 
          message: 'Invalid refresh token',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
      return res.status(401).json({ message: 'Token refresh failed' });
    }
  } catch (error) {
    console.error('Refresh token middleware error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};