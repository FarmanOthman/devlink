import { Request, Response } from 'express';
import prisma from '../../config/db';

/**
 * Get all job categories
 */
export const getJobCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobCategories = await prisma.jobCategory.findMany({
      include: {
        jobs: {
          select: {
            id: true,
            title: true,
            location: true,
            company: {
              select: {
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            jobs: true
          }
        }
      },
    });
    res.json(jobCategories);
  } catch (error) {
    console.error('Error fetching job categories:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch job categories', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch job categories', error: 'Unknown error occurred' });
    }
  }
}; 