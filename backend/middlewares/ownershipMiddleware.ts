import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { UserRole } from '../types';

/**
 * Middleware to check if the user owns the resource they are trying to access
 * @param resourceType The type of resource being accessed
 * @returns Middleware function that checks ownership
 */
const ownershipCheck = (resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId;
    const resourceId = req.params.id;
    
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
    
    let isOwner = false;
    
    try {
      switch (resourceType) {
        case 'user':
          // Users can only access their own profile
          isOwner = userId === resourceId;
          break;
          
        case 'job':
          // Check if the recruiter created this job
          const job = await prisma.job.findUnique({
            where: { id: resourceId },
          });
          isOwner = job?.userId === userId;
          break;
          
        case 'application':
          // Check if the user owns this application
          const application = await prisma.application.findUnique({
            where: { id: resourceId },
          });
          isOwner = application?.userId === userId;
          break;
          
        case 'userSkill':
          // Check if the user owns this skill
          const userSkill = await prisma.userSkill.findUnique({
            where: { id: resourceId },
          });
          isOwner = userSkill?.userId === userId;
          break;
          
        case 'document':
          // Check if the user owns this document
          const document = await prisma.document.findUnique({
            where: { id: resourceId },
          });
          isOwner = document?.userId === userId;
          break;
          
        case 'notification':
          // Check if the notification belongs to the user
          const notification = await prisma.notification.findUnique({
            where: { id: resourceId },
          });
          isOwner = notification?.userId === userId;
          break;
          
        default:
          // Default to false for unknown resource types
          isOwner = false;
      }
      
      if (isOwner) {
        next();
      } else {
        res.status(403).json({ 
          success: false, 
          message: 'You do not have permission to access this resource' 
        });
      }
    } catch (error) {
      console.error(`Error checking ownership for ${resourceType}:`, error);
      res.status(500).json({ 
        success: false, 
        message: 'An error occurred while checking permissions' 
      });
    }
  };
};

export default ownershipCheck; 