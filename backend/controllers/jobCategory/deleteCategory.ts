import { Request, Response } from 'express';
import prisma from '../../config/db';

/**
 * Delete a job category by ID
 */
export const deleteJobCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if the job category exists
    const existingJobCategory = await prisma.jobCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            jobs: true
          }
        }
      }
    });

    if (!existingJobCategory) {
      res.status(404).json({ message: 'Job category not found' });
      return;
    }

    // Check if there are jobs using this category
    if (existingJobCategory._count.jobs > 0) {
      res.status(400).json({ 
        message: 'Cannot delete category because it is being used by jobs. Update the jobs to use a different category first.',
        jobCount: existingJobCategory._count.jobs
      });
      return;
    }

    // Delete the job category
    await prisma.jobCategory.delete({
      where: { id },
    });

    res.status(204).send(); // 204 No Content
  } catch (error) {
    console.error('Error deleting job category:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to delete job category', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to delete job category', error: 'Unknown error occurred' });
    }
  }
}; 