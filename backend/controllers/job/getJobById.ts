import { Request, Response } from 'express';
import prisma from '../../config/db';

/**
 * Get a single job by ID
 */
export const getJobById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        company: true, // Include company details
        user: true,    // Include user details
      },
    });

    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch job', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch job', error: 'Unknown error occurred' });
    }
  }
}; 