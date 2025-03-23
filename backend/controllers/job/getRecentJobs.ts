import { Request, Response } from 'express';
import prisma from '../../config/db';

// Get recent jobs (last 10 posted jobs)
export const getRecentJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    // Fetch the most recent jobs
    const recentJobs = await prisma.job.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        company: true,
        category: true,
        skills: {
          include: {
            skill: true
          }
        }
      }
    });
    
    res.json(recentJobs);
  } catch (error) {
    console.error('Error fetching recent jobs:', error);
    
    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch recent jobs', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch recent jobs', error: 'Unknown error occurred' });
    }
  }
}; 