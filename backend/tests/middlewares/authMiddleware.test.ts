import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { authMiddleware, refreshTokenMiddleware } from '../../middlewares/authMiddleware';
import { verifyAccessToken, verifyRefreshToken } from '../../config/auth';
import { tokenService } from '../../services/tokenService';
import crypto from 'crypto';

// Mock dependencies
jest.mock('../../config/auth');
jest.mock('../../services/tokenService');
jest.mock('crypto');

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;
  let originalNodeEnv: string | undefined;
  const fixedTimestamp = 1625097600; // July 1, 2021 UTC

  beforeEach(() => {
    mockReq = {
      headers: {},
      cookies: {},
      path: '/api/test',
      user: {
        id: 'user-123',
        role: Role.DEVELOPER
      }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn()
    };
    mockNext = jest.fn();

    // Store original NODE_ENV
    originalNodeEnv = process.env.NODE_ENV;
    
    // Mock Date.now for consistent timestamp testing
    jest.spyOn(Date, 'now').mockReturnValue(fixedTimestamp * 1000);
    
    // Mock crypto.timingSafeEqual properly
    (crypto.timingSafeEqual as jest.Mock).mockImplementation((a, b) => {
      if (!(a instanceof Buffer) || !(b instanceof Buffer)) {
        throw new TypeError('Both arguments must be Buffer instances');
      }
      return Buffer.compare(a, b) === 0;
    });

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore NODE_ENV to its original value
    process.env.NODE_ENV = originalNodeEnv;
    
    // Restore Date.now
    jest.restoreAllMocks();
  });

  describe('CSRF Protection', () => {
    it('should skip CSRF check for exempt routes', async () => {
      const req = {
        ...mockReq,
        path: '/api/auth/login',
        headers: {
          authorization: 'Bearer valid-token'
        }
      };
      (verifyAccessToken as jest.Mock).mockReturnValue({
        userId: 'user-123',
        role: Role.DEVELOPER,
        email: 'test@example.com',
        exp: fixedTimestamp + 3600
      });
      (tokenService.hasExceededInactivityTimeout as jest.Mock).mockResolvedValue(false);

      await authMiddleware(req as Request, mockRes as Response, mockNext);

      // Middleware should call next and not return an error status
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should skip CSRF check in development with skip header', async () => {
      process.env.NODE_ENV = 'development';
      const req = {
        ...mockReq,
        headers: {
          'x-skip-csrf-check': 'true',
          authorization: 'Bearer valid-token'
        }
      };
      (verifyAccessToken as jest.Mock).mockReturnValue({
        userId: 'user-123',
        role: Role.DEVELOPER,
        email: 'test@example.com',
        exp: fixedTimestamp + 3600
      });
      (tokenService.hasExceededInactivityTimeout as jest.Mock).mockResolvedValue(false);

      await authMiddleware(req as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 403 if CSRF token is missing', async () => {
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'CSRF token missing'
      }));
    });

    it('should return 403 if CSRF token is invalid', async () => {
      const req = {
        ...mockReq,
        headers: {
          'x-csrf-token': 'invalid-token'
        },
        cookies: {
          'XSRF-TOKEN': 'valid-token'
        }
      };
      
      // Mock Buffer creation and timingSafeEqual
      (Buffer.from as jest.Mock) = jest.fn()
        .mockReturnValueOnce(Buffer.from('invalid-token'))
        .mockReturnValueOnce(Buffer.from('valid-token'));
      (crypto.timingSafeEqual as jest.Mock).mockReturnValue(false);

      await authMiddleware(req as Request, mockRes as Response, mockNext);

      expect(crypto.timingSafeEqual).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid CSRF token'
      }));
    });

    it('should proceed if CSRF token is valid', async () => {
      const req = {
        ...mockReq,
        headers: {
          'x-csrf-token': 'valid-token',
          'authorization': 'Bearer valid-token'
        },
        cookies: {
          'XSRF-TOKEN': 'valid-token'
        }
      };
      
      // Mock Buffer creation and timingSafeEqual
      (Buffer.from as jest.Mock) = jest.fn()
        .mockReturnValueOnce(Buffer.from('valid-token'))
        .mockReturnValueOnce(Buffer.from('valid-token'));
      (crypto.timingSafeEqual as jest.Mock).mockReturnValue(true);
      (verifyAccessToken as jest.Mock).mockReturnValue({
        userId: 'user-123',
        role: Role.DEVELOPER,
        email: 'test@example.com',
        exp: fixedTimestamp + 3600
      });
      (tokenService.hasExceededInactivityTimeout as jest.Mock).mockResolvedValue(false);

      await authMiddleware(req as Request, mockRes as Response, mockNext);

      expect(crypto.timingSafeEqual).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('JWT Authentication', () => {
    it('should return 401 if no authorization header is present', async () => {
      const req = {
        ...mockReq,
        path: '/api/auth/login'
      };

      await authMiddleware(req as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'No token provided'
      }));
    });

    it('should return 401 if authorization header is malformed', async () => {
      const req = {
        ...mockReq,
        path: '/api/auth/login',
        headers: {
          authorization: 'invalid-format'
        }
      };

      await authMiddleware(req as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'No token provided'
      }));
    });

    it('should return 401 if token is invalid', async () => {
      const req = {
        ...mockReq,
        path: '/api/auth/login',
        headers: {
          authorization: 'Bearer invalid-token'
        }
      };
      (verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authMiddleware(req as Request, mockRes as Response, mockNext);

      expect(verifyAccessToken).toHaveBeenCalledWith('invalid-token');
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid token'
      }));
    });

    it('should return 401 if token payload is missing required fields', async () => {
      const req = {
        ...mockReq,
        path: '/api/auth/login',
        headers: {
          authorization: 'Bearer valid-token'
        }
      };
      (verifyAccessToken as jest.Mock).mockReturnValue({
        // Missing required fields
      });

      await authMiddleware(req as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid token'
      }));
    });

    it('should return 401 if token has expired', async () => {
      const req = {
        ...mockReq,
        path: '/api/auth/login',
        headers: {
          authorization: 'Bearer valid-token'
        }
      };
      (verifyAccessToken as jest.Mock).mockReturnValue({
        userId: 'user-123',
        role: Role.DEVELOPER,
        email: 'test@example.com',
        exp: fixedTimestamp - 3600 // Expired 1 hour ago
      });

      await authMiddleware(req as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Token has expired'
      }));
    });

    it('should return 401 if session has exceeded inactivity timeout', async () => {
      const req = {
        ...mockReq,
        path: '/api/auth/login',
        headers: {
          authorization: 'Bearer valid-token'
        }
      };
      (verifyAccessToken as jest.Mock).mockReturnValue({
        userId: 'user-123',
        role: Role.DEVELOPER,
        email: 'test@example.com',
        exp: fixedTimestamp + 3600
      });
      (tokenService.hasExceededInactivityTimeout as jest.Mock).mockResolvedValue(true);

      await authMiddleware(req as Request, mockRes as Response, mockNext);

      expect(tokenService.hasExceededInactivityTimeout).toHaveBeenCalledWith('user-123');
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Session expired due to inactivity'
      }));
    });

    it('should set user in request and call next() for valid token', async () => {
      const req = {
        ...mockReq,
        path: '/api/auth/login',
        headers: {
          authorization: 'Bearer valid-token'
        }
      };
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        role: Role.DEVELOPER,
        exp: fixedTimestamp + 3600
      };
      (verifyAccessToken as jest.Mock).mockReturnValue(mockUser);
      (tokenService.hasExceededInactivityTimeout as jest.Mock).mockResolvedValue(false);

      await authMiddleware(req as Request, mockRes as Response, mockNext);

      expect(req.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        role: mockUser.role
      });
      expect(tokenService.checkActivity).toHaveBeenCalledWith('user-123');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = {
        ...mockReq,
        path: '/api/auth/login',
        headers: {
          authorization: 'Bearer valid-token'
        }
      };
      (verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected server error');
      });

      await authMiddleware(req as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid token'
      }));
    });

    it('should set security headers', async () => {
      const req = {
        ...mockReq,
        path: '/api/auth/login',
        headers: {
          authorization: 'Bearer valid-token'
        }
      };
      (verifyAccessToken as jest.Mock).mockReturnValue({
        userId: 'user-123',
        email: 'test@example.com',
        role: Role.DEVELOPER,
        exp: fixedTimestamp + 3600
      });
      (tokenService.hasExceededInactivityTimeout as jest.Mock).mockResolvedValue(false);

      await authMiddleware(req as Request, mockRes as Response, mockNext);

      // Verify that setHeader was called for security headers
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    });
  });

  describe('Refresh Token Middleware', () => {
    beforeEach(() => {
      mockReq = {
        ...mockReq,
        cookies: {
          refreshToken: 'valid-refresh-token'
        }
      };
    });

    it('should return 401 if no refresh token is provided', async () => {
      const req = {
        ...mockReq,
        cookies: {}
      };

      await refreshTokenMiddleware(req as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'No refresh token provided'
      }));
    });

    it('should return 401 if rotateRefreshToken throws an error', async () => {
      (tokenService.rotateRefreshToken as jest.Mock).mockRejectedValue(new Error('Invalid refresh token'));

      await refreshTokenMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(tokenService.rotateRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid refresh token'
      }));
    });

    it('should set new tokens and respond with accessToken on success', async () => {
      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      };
      (tokenService.rotateRefreshToken as jest.Mock).mockResolvedValue(mockTokens);

      await refreshTokenMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(tokenService.rotateRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', 'new-refresh-token', expect.any(Object));
      expect(mockRes.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        accessToken: 'new-access-token',
        expiresIn: 900
      }));
    });

    it('should handle unknown errors gracefully', async () => {
      (tokenService.rotateRefreshToken as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected server error');
      });

      await refreshTokenMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid refresh token'
      }));
    });
  });
}); 