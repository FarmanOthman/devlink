import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { UserRole } from '../types';

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

/**
 * Middleware to check if the user owns the resource they are trying to access
 * @param resourceType The type of resource being accessed
 * @param checkBothUserAndRecruiter For applications, check if user is either the applicant or the recruiter
 * @returns Middleware function that checks ownership
 */
const ownershipCheck = (resourceType: string | ResourceType, checkBothUserAndRecruiter = false) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const resourceId = req.params.id;
      
      // Validate input parameters
      if (!resourceId) {
        res.status(400).json({ success: false, message: 'Resource ID is required' });
        return;
      }
      
      // Skip ownership check for admins as they have full access
      if (req.user?.role === UserRole.ADMIN) {
        next();
        return;
      }
      
      // If no user ID found in token, deny access
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
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
      const isOwner = await checkResourceOwnership(resourceType, resourceId, userId, checkBothUserAndRecruiter);
      
      if (isOwner) {
        next();
      } else {
        res.status(403).json({ 
          success: false, 
          message: 'You do not have permission to access this resource' 
        });
      }
    } catch (error) {
      console.error(`Error in ownership middleware for ${resourceType}:`, error);
      res.status(500).json({ 
        success: false, 
        message: 'An error occurred while checking permissions' 
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
    
    if (application?.job?.userId === userId) {
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
 * Check if a user owns a specific resource
 */
async function checkResourceOwnership(
  resourceType: string | ResourceType, 
  resourceId: string, 
  userId: string,
  checkBothUserAndRecruiter = false
): Promise<boolean> {
  switch (resourceType) {
    case ResourceType.USER:
      // Users can only access their own profile
      return userId === resourceId;
    
    case ResourceType.JOB:
      const job = await prisma.job.findUnique({
        where: { id: resourceId }
      });
      return job?.userId === userId;
    
    case ResourceType.APPLICATION:
      const application = await prisma.application.findUnique({
        where: { id: resourceId }
      });
      
      // If checkBothUserAndRecruiter is true, check if the user is either the applicant or the recruiter
      if (checkBothUserAndRecruiter) {
        // First check applicant
        if (application?.userId === userId) {
          return true;
        }
        
        // Then check recruiter using raw query
        const appWithRecruiter = await prisma.$queryRaw`
          SELECT * FROM "Application" WHERE id = ${resourceId} AND "recruiterId" = ${userId}
        `;
        
        return Array.isArray(appWithRecruiter) && appWithRecruiter.length > 0;
      }
      
      return application?.userId === userId;
    
    case ResourceType.USER_SKILL:
      const userSkill = await prisma.userSkill.findUnique({
        where: { id: resourceId }
      });
      return userSkill?.userId === userId;
    
    case ResourceType.DOCUMENT:
      const document = await prisma.document.findUnique({
        where: { id: resourceId }
      });
      return document?.userId === userId;
    
    case ResourceType.NOTIFICATION:
      const notification = await prisma.notification.findUnique({
        where: { id: resourceId }
      });
      return notification?.userId === userId;
    
    case ResourceType.SAVED_JOB:
      try {
        const savedJob = await prisma.savedJob.findUnique({
          where: { id: resourceId }
        });
        return savedJob?.userId === userId;
      } catch (error) {
        console.error('Error checking savedJob ownership:', error);
        return false;
      }
    
    default:
      // For unknown resource types, deny access
      console.warn(`Unknown resource type: ${resourceType}`);
      return false;
  }
}

export default ownershipCheck; 