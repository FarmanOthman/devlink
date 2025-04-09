import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { UserRole } from '../types';

// Centralized error messages for consistency
const ERROR_MESSAGES = {
  RESOURCE_ID_REQUIRED: 'Resource ID is required',
  AUTHENTICATION_REQUIRED: 'Authentication required',
  PERMISSION_DENIED: 'You do not have permission to access this resource',
  RESOURCE_NOT_FOUND: 'Resource not found',
  SERVER_ERROR: 'An error occurred while checking permissions'
};

// Define resource types to avoid string literals
export enum ResourceType {
  USER = 'user',
  JOB = 'job',
  APPLICATION = 'application',
  USER_SKILL = 'userSkill',
  DOCUMENT = 'document',
  NOTIFICATION = 'notification',
  SAVED_JOB = 'savedJob',
}

// Define ownership check result interface
interface OwnershipResult {
  found: boolean;
  isOwner: boolean;
}

/**
 * Middleware to check if the user owns the resource they are trying to access
 * @param resourceType The type of resource being accessed
 * @param checkBothUserAndRecruiter For applications, check if user is either the applicant or the recruiter
 * @returns Middleware function that checks ownership
 */
const ownershipCheck = (resourceType: string | ResourceType, checkBothUserAndRecruiter = false) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const resourceId = req.params.id;
      
      // Validate input parameters
      if (!resourceId) {
        res.status(400).json({ success: false, message: ERROR_MESSAGES.RESOURCE_ID_REQUIRED });
        return;
      }
      
      // Skip ownership check for admins as they have full access
      if (req.user?.role === UserRole.ADMIN) {
        next();
        return;
      }
      
      // If no user ID found in token, deny access
      if (!userId) {
        res.status(401).json({ success: false, message: ERROR_MESSAGES.AUTHENTICATION_REQUIRED });
        return;
      }

      // Handle recruiters accessing related resources
      if (req.user?.role === UserRole.RECRUITER) {
        const hasAccess = await checkRecruiterAccess(resourceType, resourceId, userId);
        if (hasAccess) {
          next();
          return;
        }
      }
      
      // Check ownership for the specific resource type
      const result = await checkResourceOwnership(resourceType, resourceId, userId, checkBothUserAndRecruiter);
      
      if (!result.found) {
        res.status(404).json({
          success: false,
          message: ERROR_MESSAGES.RESOURCE_NOT_FOUND
        });
        return;
      }
      
      if (result.isOwner) {
        next();
      } else {
        res.status(403).json({ 
          success: false, 
          message: ERROR_MESSAGES.PERMISSION_DENIED 
        });
      }
    } catch (error) {
      console.error(`Error in ownership middleware for ${resourceType}:`, error);
      res.status(500).json({ 
        success: false, 
        message: ERROR_MESSAGES.SERVER_ERROR 
      });
    }
  };
};

/**
 * Check if a recruiter has special access to a resource
 */
async function checkRecruiterAccess(
  resourceType: string | ResourceType, 
  resourceId: string, 
  userId: string
): Promise<boolean> {
  // Special case for recruiters accessing applications for their jobs
  if (resourceType === ResourceType.APPLICATION) {
    // First check if the recruiter owns the job
    const application = await prisma.application.findUnique({
      where: { id: resourceId },
      include: { job: true }
    });
    
    if (!application) {
      return false;
    }
    
    if (application.job?.userId === userId) {
      return true;
    }
    
    // Then check if recruiter is associated with the application for interview
    // Using raw query since TypeScript doesn't recognize the new field yet
    const appWithRecruiter = await prisma.$queryRaw`
      SELECT * FROM "Application" WHERE id = ${resourceId} AND "recruiterId" = ${userId}
    `;
    
    return Array.isArray(appWithRecruiter) && appWithRecruiter.length > 0;
  } 
  
  // For job postings, check if the recruiter is the creator
  if (resourceType === ResourceType.JOB) {
    const job = await prisma.job.findUnique({
      where: { id: resourceId }
    });
    
    return job?.userId === userId;
  }
  
  return false;
}

/**
 * Helper function for standard ownership checks
 */
async function checkStandardOwnership(
  model: any,
  resourceId: string,
  userId: string
): Promise<OwnershipResult> {
  const resource = await model.findUnique({
    where: { id: resourceId }
  });
  
  if (!resource) {
    return { found: false, isOwner: false };
  }
  
  return { found: true, isOwner: resource.userId === userId };
}

/**
 * Check if a user owns a specific resource
 */
async function checkResourceOwnership(
  resourceType: string | ResourceType, 
  resourceId: string, 
  userId: string,
  checkBothUserAndRecruiter = false
): Promise<OwnershipResult> {
  switch (resourceType) {
    case ResourceType.USER:
      // Users can only access their own profile
      return { found: true, isOwner: userId === resourceId };
    
    case ResourceType.JOB:
      return checkStandardOwnership(prisma.job, resourceId, userId);
    
    case ResourceType.APPLICATION:
      const application = await prisma.application.findUnique({
        where: { id: resourceId }
      });
      
      if (!application) {
        return { found: false, isOwner: false };
      }
      
      // If checkBothUserAndRecruiter is true, check if the user is either the applicant or the recruiter
      if (checkBothUserAndRecruiter) {
        // First check applicant
        if (application.userId === userId) {
          return { found: true, isOwner: true };
        }
        
        // Then check recruiter using raw query
        const appWithRecruiter = await prisma.$queryRaw`
          SELECT * FROM "Application" WHERE id = ${resourceId} AND "recruiterId" = ${userId}
        `;
        
        const isRecruiter = Array.isArray(appWithRecruiter) && appWithRecruiter.length > 0;
        return { found: true, isOwner: isRecruiter };
      }
      
      return { found: true, isOwner: application.userId === userId };
    
    case ResourceType.USER_SKILL:
      return checkStandardOwnership(prisma.userSkill, resourceId, userId);
    
    case ResourceType.DOCUMENT:
      return checkStandardOwnership(prisma.document, resourceId, userId);
    
    case ResourceType.NOTIFICATION:
      return checkStandardOwnership(prisma.notification, resourceId, userId);
    
    case ResourceType.SAVED_JOB:
      try {
        return checkStandardOwnership(prisma.savedJob, resourceId, userId);
      } catch (error) {
        console.error('Error checking savedJob ownership:', error);
        return { found: false, isOwner: false };
      }
    
    default:
      // For unknown resource types, deny access
      console.warn(`Unknown resource type: ${resourceType}`);
      return { found: true, isOwner: false };
  }
}

export default ownershipCheck; 