import { Request, Response } from 'express';
import prisma from '../../config/db';

// Get all saved jobs for a user
export const getSavedJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const isAdmin = req.user?.role === 'ADMIN';
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // For admins, they can optionally specify a userId to view saved jobs for a specific user
    const targetUserId = isAdmin && req.query.userId ? String(req.query.userId) : userId;
    
    const savedJobs = await prisma.savedJob.findMany({
      where: {
        userId: targetUserId
      },
      include: {
        job: {
          include: {
            company: true,
            category: true,
            skills: {
              include: {
                skill: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: savedJobs
    });
  } catch (error) {
    console.error('Failed to fetch saved jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch saved jobs'
    });
  }
}; 