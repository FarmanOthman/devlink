import { Request, Response } from 'express';
import prisma from '../../config/db';
import { JwtPayload } from '../../types/userTypes';

// Get all applications
export const getApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    // If the user is a recruiter, only show applications for their jobs
    if (req.user?.role === 'RECRUITER') {
      console.log(`Fetching applications for recruiter: ${req.user.id}`);
      
      const applications = await prisma.application.findMany({
        where: {
          job: {
            userId: req.user.id
          },
          deletedAt: null
        },
        include: {
          user: true,
          job: {
            include: {
              company: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });
      
      res.json({ success: true, data: applications });
      return;
    }

    // For admins, show all applications
    if (req.user?.role === 'ADMIN') {
      console.log('Fetching all applications for admin');
      
      const applications = await prisma.application.findMany({
        where: {
          deletedAt: null
        },
        include: {
          user: true,
          job: {
            include: {
              company: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      res.json({ success: true, data: applications });
      return;
    }

    // If not admin or recruiter, return forbidden
    res.status(403).json({ 
      success: false,
      message: 'You do not have permission to view all applications' 
    });
  } catch (error) {
    console.error('Failed to fetch applications:', error);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
}; 