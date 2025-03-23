import { Request, Response } from 'express';
import prisma from '../../config/db';

/**
 * Get a single job category by ID
 */
export const getJobCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const jobCategory = await prisma.jobCategory.findUnique({
      where: { id },
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

    if (!jobCategory) {
      res.status(404).json({ message: 'Job category not found' });
      return;
    }

    res.json(jobCategory);
  } catch (error) {
    console.error('Error fetching job category:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch job category', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch job category', error: 'Unknown error occurred' });
    }
  }
}; 