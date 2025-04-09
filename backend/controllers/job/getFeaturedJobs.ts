import { Request, Response } from 'express';
import prisma from '../../config/db';

// Get featured jobs (jobs with highest view counts)
export const getFeaturedJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    
    // Fetch "featured" jobs (using the most viewed jobs as featured)
    const featuredJobs = await prisma.job.findMany({
      take: limit,
      orderBy: {
        viewCount: 'desc'  // Use viewCount to determine "featured" jobs
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
    
    res.json(featuredJobs);
  } catch (error) {
    console.error('Error fetching featured jobs:', error);
    
    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch featured jobs', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch featured jobs', error: 'Unknown error occurred' });
    }
  }
}; 