import { Request, Response } from 'express';
import prisma from '../../config/db';
import { tokenService } from '../../services/tokenService';
import { handleApiError, ErrorCodes, logError } from './utils';

// Delete a user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.userId;
    const isSelfDelete = currentUserId === id;

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

    try {
      // First, perform the actual user delete operation
      await prisma.user.delete({
        where: { id }
      });
    } catch (deleteError) {
      // Handle deletion errors separately without exposing details
      logError(deleteError, 'Error in user deletion', { userId: id });
      
      // If the error is related to foreign key constraints, 
      // it means we need to delete related records first
      if (deleteError instanceof Error && deleteError.message.includes('foreign key constraint')) {
        // Log the specifics but don't expose in response
        logError(deleteError, 'Foreign key constraint when deleting user', { 
          userId: id, 
          errorInfo: 'Attempting cascade deletion'
        });
        
        try {
          // Try to delete all possible related records
          // We're using individual try-catch blocks to ensure one failure doesn't stop others
          
          try {
            await prisma.userSkill.deleteMany({ where: { userId: id } });
          } catch (e) { 
            logError(e, 'Error deleting userSkill records', { userId: id });
          }
          
          try {
            await prisma.application.deleteMany({ where: { userId: id } });
          } catch (e) { 
            logError(e, 'Error deleting application records', { userId: id });
          }
          
          try {
            await prisma.document.deleteMany({ where: { userId: id } });
          } catch (e) { 
            logError(e, 'Error deleting document records', { userId: id });
          }
          
          try {
            await prisma.savedJob.deleteMany({ where: { userId: id } });
          } catch (e) { 
            logError(e, 'Error deleting savedJob records', { userId: id });
          }
          
          try {
            await prisma.notification.deleteMany({ where: { userId: id } });
          } catch (e) { 
            logError(e, 'Error deleting notification records', { userId: id });
          }
          
          // Now try to delete the user again
          await prisma.user.delete({ where: { id } });
        } catch (cascadeError) {
          logError(cascadeError, 'Failed cascade deletion for user', { userId: id });
          return res.status(500).json({ 
            success: false, 
            error: {
              code: ErrorCodes.DATABASE_ERROR,
              message: 'Unable to delete user account due to existing data. Please contact support.'
            }
          });
        }
      } else {
        // If it's not a foreign key issue, handle generically
        return res.status(500).json({ 
          success: false, 
          error: {
            code: ErrorCodes.DATABASE_ERROR,
            message: 'Failed to delete user account'
          }
        });
      }
    }

    // Invalidate all tokens for this user
    await tokenService.invalidateAllUserTokens(id);

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
        message: 'User deleted successfully' 
      });
    }
  } catch (error) {
    handleApiError(res, error, 'Failed to delete user');
  }
}; 