import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import ownershipCheck, { ResourceType } from '../../middlewares/ownershipMiddleware';
import prisma from '../../config/db';

// Define error messages for consistent testing
const ERROR_MESSAGES = {
  RESOURCE_ID_REQUIRED: 'Resource ID is required',
  AUTHENTICATION_REQUIRED: 'Authentication required',
  PERMISSION_DENIED: 'You do not have permission to access this resource',
  RESOURCE_NOT_FOUND: 'Resource not found',
  SERVER_ERROR: 'An error occurred while checking permissions'
};

// Mock dependencies
jest.mock('../../config/db', () => ({
  __esModule: true,
  default: {
    job: {
      findUnique: jest.fn()
    },
    application: {
      findUnique: jest.fn()
    },
    userSkill: {
      findUnique: jest.fn()
    },
    document: {
      findUnique: jest.fn()
    },
    notification: {
      findUnique: jest.fn()
    },
    savedJob: {
      findUnique: jest.fn()
    },
    $queryRaw: jest.fn()
  }
}));

describe('Ownership Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      params: { id: 'test-id' },
      user: {
        id: 'user-123',
        role: Role.DEVELOPER
      }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  // Helper function to test resource ownership
  const testResourceOwnership = async (
    resourceType: ResourceType, 
    mockFn: jest.Mock, 
    mockValue: any, 
    shouldAllow: boolean
  ) => {
    mockFn.mockResolvedValue(mockValue);
    await ownershipCheck(resourceType)(mockReq as Request, mockRes as Response, mockNext);
    
    if (shouldAllow) {
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    } else {
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: ERROR_MESSAGES.PERMISSION_DENIED
      }));
    }
  };

  // Helper function to test nonexistent resources
  const testResourceNotFound = async (resourceType: ResourceType, mockFn: jest.Mock) => {
    mockFn.mockResolvedValue(null);
    await ownershipCheck(resourceType)(mockReq as Request, mockRes as Response, mockNext);
    
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: ERROR_MESSAGES.RESOURCE_NOT_FOUND
    }));
  };

  describe('Basic Validation', () => {
    it('should return 400 if resource ID is missing', async () => {
      const req = {
        ...mockReq,
        params: {}
      };
      
      await ownershipCheck(ResourceType.USER)(req as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: ERROR_MESSAGES.RESOURCE_ID_REQUIRED
      }));
    });

    it('should return 401 if user is not authenticated', async () => {
      const req = {
        ...mockReq,
        user: undefined
      };
      
      await ownershipCheck(ResourceType.USER)(req as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: ERROR_MESSAGES.AUTHENTICATION_REQUIRED
      }));
    });

    it('should allow access for admin users without checking ownership', async () => {
      const req = {
        ...mockReq,
        user: {
          id: 'admin-123',
          role: Role.ADMIN
        }
      };
      
      await ownershipCheck(ResourceType.USER)(req as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('Resource Type Checks', () => {
    describe('USER resource', () => {
      it('should allow access if user ID matches resource ID', async () => {
        const req = {
          ...mockReq,
          params: { id: 'user-123' }
        };
        
        await ownershipCheck(ResourceType.USER)(req as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      it('should deny access if user ID does not match resource ID', async () => {
        const req = {
          ...mockReq,
          params: { id: 'different-user' }
        };
        
        await ownershipCheck(ResourceType.USER)(req as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
      });
    });

    describe('JOB resource', () => {
      it('should allow access if user owns the job', async () => {
        await testResourceOwnership(
          ResourceType.JOB,
          prisma.job.findUnique as jest.Mock,
          { userId: 'user-123' },
          true
        );
      });

      it('should deny access if user does not own the job', async () => {
        await testResourceOwnership(
          ResourceType.JOB,
          prisma.job.findUnique as jest.Mock,
          { userId: 'different-user' },
          false
        );
      });

      it('should return 404 if the job does not exist', async () => {
        await testResourceNotFound(ResourceType.JOB, prisma.job.findUnique as jest.Mock);
      });
      
      it('should allow access if user is a recruiter and owns the job', async () => {
        const req = {
          ...mockReq,
          user: {
            id: 'recruiter-123',
            role: Role.RECRUITER
          }
        };
        
        (prisma.job.findUnique as jest.Mock).mockResolvedValue({
          userId: 'recruiter-123'
        });
        
        await ownershipCheck(ResourceType.JOB)(req as Request, mockRes as Response, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('APPLICATION resource', () => {
      it('should allow access if user is the applicant', async () => {
        await testResourceOwnership(
          ResourceType.APPLICATION,
          prisma.application.findUnique as jest.Mock,
          { userId: 'user-123' },
          true
        );
      });

      it('should allow access if user is the recruiter and checkBothUserAndRecruiter is true', async () => {
        const req = {
          ...mockReq,
          user: {
            id: 'recruiter-123',
            role: Role.RECRUITER
          }
        };
        (prisma.application.findUnique as jest.Mock).mockResolvedValue({
          userId: 'different-user',
          job: { userId: 'recruiter-123' }
        });
        
        await ownershipCheck(ResourceType.APPLICATION, true)(req as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      it('should deny access if user is neither applicant nor recruiter', async () => {
        (prisma.application.findUnique as jest.Mock).mockResolvedValue({
          userId: 'different-user'
        });
        (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
        
        await ownershipCheck(ResourceType.APPLICATION)(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
      });
      
      it('should return 404 if the application does not exist', async () => {
        await testResourceNotFound(ResourceType.APPLICATION, prisma.application.findUnique as jest.Mock);
      });
      
      it('should deny access if recruiter does not own the job linked to the application', async () => {
        const req = {
          ...mockReq,
          user: {
            id: 'recruiter-123',
            role: Role.RECRUITER
          }
        };
        
        (prisma.application.findUnique as jest.Mock).mockResolvedValue({
          userId: 'applicant-123',
          job: { userId: 'different-recruiter' }
        });
        (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
        
        await ownershipCheck(ResourceType.APPLICATION, true)(req as Request, mockRes as Response, mockNext);
        
        expect(mockRes.status).toHaveBeenCalledWith(403);
      });
      
      it('should allow access if recruiter is assigned to the application via recruiterId field', async () => {
        const req = {
          ...mockReq,
          user: {
            id: 'recruiter-123',
            role: Role.RECRUITER
          }
        };
        
        (prisma.application.findUnique as jest.Mock).mockResolvedValue({
          userId: 'applicant-123',
          job: { userId: 'different-recruiter' }
        });
        (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ id: 'test-id', recruiterId: 'recruiter-123' }]);
        
        await ownershipCheck(ResourceType.APPLICATION)(req as Request, mockRes as Response, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('USER_SKILL resource', () => {
      it('should allow access if user owns the skill', async () => {
        await testResourceOwnership(
          ResourceType.USER_SKILL,
          prisma.userSkill.findUnique as jest.Mock,
          { userId: 'user-123' },
          true
        );
      });

      it('should deny access if user does not own the skill', async () => {
        await testResourceOwnership(
          ResourceType.USER_SKILL,
          prisma.userSkill.findUnique as jest.Mock,
          { userId: 'different-user' },
          false
        );
      });
      
      it('should return 404 if the user skill does not exist', async () => {
        await testResourceNotFound(ResourceType.USER_SKILL, prisma.userSkill.findUnique as jest.Mock);
      });
    });

    describe('DOCUMENT resource', () => {
      it('should allow access if user owns the document', async () => {
        await testResourceOwnership(
          ResourceType.DOCUMENT,
          prisma.document.findUnique as jest.Mock,
          { userId: 'user-123' },
          true
        );
      });

      it('should deny access if user does not own the document', async () => {
        await testResourceOwnership(
          ResourceType.DOCUMENT,
          prisma.document.findUnique as jest.Mock,
          { userId: 'different-user' },
          false
        );
      });
      
      it('should return 404 if the document does not exist', async () => {
        await testResourceNotFound(ResourceType.DOCUMENT, prisma.document.findUnique as jest.Mock);
      });
    });

    describe('NOTIFICATION resource', () => {
      it('should allow access if user owns the notification', async () => {
        await testResourceOwnership(
          ResourceType.NOTIFICATION,
          prisma.notification.findUnique as jest.Mock,
          { userId: 'user-123' },
          true
        );
      });

      it('should deny access if user does not own the notification', async () => {
        await testResourceOwnership(
          ResourceType.NOTIFICATION,
          prisma.notification.findUnique as jest.Mock,
          { userId: 'different-user' },
          false
        );
      });
      
      it('should return 404 if the notification does not exist', async () => {
        await testResourceNotFound(ResourceType.NOTIFICATION, prisma.notification.findUnique as jest.Mock);
      });
    });

    describe('SAVED_JOB resource', () => {
      it('should allow access if user owns the saved job', async () => {
        await testResourceOwnership(
          ResourceType.SAVED_JOB,
          prisma.savedJob.findUnique as jest.Mock,
          { userId: 'user-123' },
          true
        );
      });

      it('should deny access if user does not own the saved job', async () => {
        await testResourceOwnership(
          ResourceType.SAVED_JOB,
          prisma.savedJob.findUnique as jest.Mock,
          { userId: 'different-user' },
          false
        );
      });
      
      it('should return 404 if the saved job does not exist', async () => {
        await testResourceNotFound(ResourceType.SAVED_JOB, prisma.savedJob.findUnique as jest.Mock);
      });

      it('should handle database errors gracefully', async () => {
        (prisma.savedJob.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));
        
        await ownershipCheck(ResourceType.SAVED_JOB)(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: ERROR_MESSAGES.SERVER_ERROR
        }));
      });
    });

    describe('Unknown resource type', () => {
      it('should return 403 with a clear message for unknown resource types', async () => {
        await ownershipCheck('unknown-type' as ResourceType)(mockReq as Request, mockRes as Response, mockNext);
        
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: ERROR_MESSAGES.PERMISSION_DENIED
        }));
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      (prisma.job.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      await ownershipCheck(ResourceType.JOB)(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: ERROR_MESSAGES.SERVER_ERROR
      }));
    });
  });
}); 