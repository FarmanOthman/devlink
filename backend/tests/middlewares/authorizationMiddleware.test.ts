import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import authorizationMiddleware from '../../middlewares/authorizationMiddleware';
import { UserRole } from '../../types';

// Centralized error messages for testing
const ERROR_MESSAGES = {
  ACCESS_DENIED: 'Access denied. Insufficient permissions.',
  UNAUTHORIZED: 'Access denied. User not authenticated.',
  EMPTY_ROLES: 'Access denied. No roles are allowed.',
  INVALID_ROLE: 'Access denied. Invalid user role.',
  SERVER_ERROR: 'Internal server error'
};

describe('Authorization Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      user: undefined
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  it('should return 401 if user is not authenticated', () => {
    // User is not defined in the request
    const middleware = authorizationMiddleware([UserRole.DEVELOPER]);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      message: ERROR_MESSAGES.UNAUTHORIZED
    }));
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 403 if user role is not allowed', () => {
    // User has DEVELOPER role, but only ADMIN is allowed
    mockReq.user = {
      id: 'user-123',
      role: UserRole.DEVELOPER
    };
    
    const middleware = authorizationMiddleware([UserRole.ADMIN]);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      message: ERROR_MESSAGES.ACCESS_DENIED,
      requiredRoles: [UserRole.ADMIN],
      userRole: UserRole.DEVELOPER
    }));
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next() if user role is allowed', () => {
    // User has DEVELOPER role, and DEVELOPER is allowed
    mockReq.user = {
      id: 'user-123',
      role: UserRole.DEVELOPER
    };
    
    const middleware = authorizationMiddleware([UserRole.DEVELOPER]);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should call next() if user has one of multiple allowed roles', () => {
    // User has ADMIN role, and both DEVELOPER and ADMIN are allowed
    mockReq.user = {
      id: 'user-123',
      role: UserRole.ADMIN
    };
    
    const middleware = authorizationMiddleware([UserRole.DEVELOPER, UserRole.ADMIN]);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  // New test cases for improvements
  it('should return 403 if allowed roles list is empty', () => {
    mockReq.user = {
      id: 'user-123',
      role: UserRole.DEVELOPER
    };

    const middleware = authorizationMiddleware([]);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      message: ERROR_MESSAGES.EMPTY_ROLES,
      requiredRoles: [],
      userRole: UserRole.DEVELOPER
    }));
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 500 if user role is undefined', () => {
    mockReq.user = {
      id: 'user-123',
      role: undefined as unknown as Role
    };

    const middleware = authorizationMiddleware([UserRole.DEVELOPER]);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      message: ERROR_MESSAGES.SERVER_ERROR,
      details: 'User role is undefined'
    }));
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 403 if user role is invalid', () => {
    mockReq.user = {
      id: 'user-123',
      role: 'INVALID_ROLE' as Role
    };

    const middleware = authorizationMiddleware([UserRole.DEVELOPER]);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      message: ERROR_MESSAGES.INVALID_ROLE,
      requiredRoles: [UserRole.DEVELOPER],
      userRole: 'INVALID_ROLE'
    }));
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should allow custom error messages', () => {
    mockReq.user = {
      id: 'user-123',
      role: UserRole.DEVELOPER
    };

    const customMessages = {
      forbiddenMessage: 'Custom forbidden message'
    };

    const middleware = authorizationMiddleware([UserRole.ADMIN], customMessages);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Custom forbidden message',
      requiredRoles: [UserRole.ADMIN],
      userRole: UserRole.DEVELOPER
    }));
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should work correctly after authentication middleware sets user', () => {
    // Simulate authentication middleware setting the user
    mockReq.user = {
      id: 'user-123',
      role: UserRole.ADMIN
    };

    const middleware = authorizationMiddleware([UserRole.ADMIN]);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });
}); 