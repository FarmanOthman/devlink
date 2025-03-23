import { Request, Response } from 'express';
import prisma from '../../config/db';

/**
 * Get all jobs
 */
export const getJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        company: true, // Include company details
        user: true,    // Include user details
      },
    });
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch jobs', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch jobs', error: 'Unknown error occurred' });
    }
  }
}; 