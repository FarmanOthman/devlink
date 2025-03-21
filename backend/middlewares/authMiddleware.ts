import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../config/auth';
import { tokenService } from '../services/tokenService';
import { JwtPayload } from '../types/userTypes';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the access token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const accessToken = authHeader.split(' ')[1];
    
    try {
      // Verify the access token
      const decoded = verifyAccessToken(accessToken);
      req.user = decoded;

      // Check for inactivity timeout
      const hasExceededTimeout = await tokenService.hasExceededInactivityTimeout(decoded.userId);
      if (hasExceededTimeout) {
        return res.status(401).json({ message: 'Session expired due to inactivity' });
      }

      // Update user activity
      await tokenService.checkActivity(decoded.userId);

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
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
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Send the new access token
      res.json({ accessToken });
    } catch (error) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};