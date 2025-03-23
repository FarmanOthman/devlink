import { Request, Response } from 'express';
import prisma from '../../config/db';

// Get all jobs posted by a specific user
export const getJobsByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Fetch jobs for the given user
    const jobs = await prisma.job.findMany({
      where: { 
        userId,
        deletedAt: null 
      },
      include: {
        company: true,
        category: true,
        skills: {
          include: {
            skill: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching user jobs:', error);
    
    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch user jobs', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch user jobs', error: 'Unknown error occurred' });
    }
  }
}; 