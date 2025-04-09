import { Request, Response } from 'express';
import { tokenService } from '../../services/tokenService';
import { handleApiError } from './utils';

// Logout user
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Clear the refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // If there's a refresh token, blacklist it
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await tokenService.blacklistToken(refreshToken);
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    handleApiError(res, error, 'Logout failed');
  }
}; 