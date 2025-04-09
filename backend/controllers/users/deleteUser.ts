import { Request, Response } from 'express';
import prisma from '../../config/db';
import { tokenService } from '../../services/tokenService';
import { handleApiError, ErrorCodes, logError } from './utils';

// Delete a user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    const userRole = req.user?.role;
    const isSelfDelete = currentUserId === id;

    // Ensure the user actually has permission
    // Note: This is a secondary check in addition to the ownershipCheck middleware
    if (!isSelfDelete && userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: ErrorCodes.AUTHORIZATION_ERROR,
          message: 'You do not have permission to delete this user account',
        }
      });
    }

    // Get user before deletion to verify existence
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: 'User not found'
        }
      });
    }

    // We'll use a transaction to ensure deletion is atomic
    // and we can properly handle any errors
    try {
      await prisma.$transaction(async (tx) => {
        // Delete all related records first to avoid foreign key constraints
        // The order matters - we delete the models that reference the user first
        
        // Jobs created by the user
        const userJobs = await tx.job.findMany({
          where: { userId: id },
          select: { id: true }
        });
        
        // For each job, we need to clean up related records first
        for (const job of userJobs) {
          await tx.jobSkill.deleteMany({
            where: { jobId: job.id }
          });
          
          await tx.application.deleteMany({
            where: { jobId: job.id }
          });
        }
        
        // Now delete the jobs
        await tx.job.deleteMany({
          where: { userId: id }
        });
        
        // Delete user skills
        await tx.userSkill.deleteMany({
          where: { userId: id }
        });
        
        // Delete applications
        await tx.application.deleteMany({
          where: { userId: id }
        });
        
        // Delete user documents
        await tx.document.deleteMany({
          where: { userId: id }
        });
        
        // Delete saved jobs
        await tx.savedJob.deleteMany({
          where: { userId: id }
        });
        
        // Delete notifications
        await tx.notification.deleteMany({
          where: { userId: id }
        });
        
        // Invalidate all tokens for this user by updating tokenVersion
        // This must happen before deleting the user
        await tx.user.update({
          where: { id },
          data: { tokenVersion: { increment: 1 } }
        });
        
        // Finally delete the user
        await tx.user.delete({
          where: { id }
        });
      });
    } catch (deleteError) {
      logError(deleteError, 'Error in user deletion transaction', { userId: id });
      
      // Detailed error handling with specific messages
      if (deleteError instanceof Error) {
        // Database constraint issue
        if (deleteError.message.includes('foreign key constraint')) {
          return res.status(409).json({
            success: false,
            error: {
              code: ErrorCodes.CONFLICT,
              message: 'Cannot delete account because it has active relationships with other records',
              details: [
                'Please remove all associated applications, jobs, or other content first',
                'You may need to contact support if you cannot remove these items yourself'
              ]
            }
          });
        }
        
        // Check for specific database errors
        if ('code' in deleteError) {
          const prismaError = deleteError as any;
          
          if (prismaError.code === 'P2025') {
            return res.status(404).json({
              success: false,
              error: {
                code: ErrorCodes.NOT_FOUND,
                message: 'User account no longer exists'
              }
            });
          }
          
          if (prismaError.code === 'P2003') {
            return res.status(409).json({
              success: false,
              error: {
                code: ErrorCodes.CONFLICT,
                message: 'Cannot delete your account while you have active records in the system',
                details: ['Please remove your jobs, applications, or other content first']
              }
            });
          }
        }
      }
      
      // Generic database error
      return res.status(500).json({
        success: false,
        error: {
          code: ErrorCodes.DATABASE_ERROR,
          message: 'Failed to delete account due to database constraints',
          details: [
            'Please try again later or contact support for assistance',
            'If you continue to see this error, there may be data linked to your account that needs to be removed first'
          ]
        }
      });
    }

    // If the user is deleting their own account, clear cookies
    if (isSelfDelete) {
      // Clear the refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
    }

    // Log the account deletion event (no sensitive data)
    logError(null, `User account deleted`, { 
      userId: id, 
      deletedBy: isSelfDelete ? 'self' : 'admin',
      adminId: isSelfDelete ? null : currentUserId
    });

    // Return different response based on who performed the deletion
    if (isSelfDelete) {
      res.status(200).json({ 
        success: true, 
        message: 'Your account has been successfully deleted. You have been logged out.' 
      });
    } else {
      res.status(200).json({ 
        success: true, 
        message: `User ${user.email} has been successfully deleted` 
      });
    }
  } catch (error) {
    handleApiError(res, error, 'Failed to delete user account');
  }
}; 