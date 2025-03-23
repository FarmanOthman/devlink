import { Request, Response } from 'express';
import prisma from '../../config/db';

/**
 * Update a job category by ID
 */
export const updateJobCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Validate required fields
    if (!name) {
      res.status(400).json({ message: 'Missing required field: name' });
      return;
    }

    // Check if the job category exists
    const existingJobCategory = await prisma.jobCategory.findUnique({
      where: { id },
    });

    if (!existingJobCategory) {
      res.status(404).json({ message: 'Job category not found' });
      return;
    }

    // Update the job category
    const updatedJobCategory = await prisma.jobCategory.update({
      where: { id },
      data: { name },
      include: {
        _count: {
          select: {
            jobs: true
          }
        }
      }
    });

    res.json(updatedJobCategory);
  } catch (error) {
    console.error('Error updating job category:', error);

    // Handle specific Prisma errors
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      res.status(400).json({ message: 'A category with this name already exists' });
      return;
    }

    // Handle other unexpected errors
    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to update job category', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to update job category', error: 'Unknown error occurred' });
    }
  }
}; 